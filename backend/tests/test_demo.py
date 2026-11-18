import pytest
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.demo import DEMO_EMAIL, ensure_demo_user
from logs.models import DailyLog, FoodEntry

User = get_user_model()


@pytest.mark.django_db
def test_demo_login_post_returns_token_and_user(client):
    response = client.post('/api/auth/demo-login/')
    assert response.status_code == 200
    assert response.data['email'] == DEMO_EMAIL
    assert response.data['token']


@pytest.mark.django_db
def test_demo_login_get_redirects_to_frontend(client):
    response = client.get('/api/auth/demo-login/')
    assert response.status_code == 302
    assert '/demo?token=' in response['Location']


@pytest.mark.django_db
def test_demo_user_cannot_use_password_login(client):
    ensure_demo_user()
    response = client.post('/api/auth/login/', {
        'email': DEMO_EMAIL, 'password': ''
    }, content_type='application/json')
    assert response.status_code in (400, 401)


@pytest.mark.django_db
def test_demo_data_ends_today_and_is_not_empty():
    user = ensure_demo_user()
    today = timezone.now().date()
    assert DailyLog.objects.filter(user=user, date=today, food_entries__isnull=False).exists()
    assert DailyLog.objects.filter(user=user).count() > 100
    # the most recent days are always logged so the streak is alive
    for offset in range(5):
        assert FoodEntry.objects.filter(log__user=user, log__date=today - timedelta(days=offset)).exists()


@pytest.mark.django_db
def test_demo_data_refreshes_when_stale():
    user = ensure_demo_user()
    today = timezone.now().date()
    DailyLog.objects.filter(user=user, date=today).delete()
    ensure_demo_user()
    assert DailyLog.objects.filter(user=user, date=today, food_entries__isnull=False).exists()


@pytest.mark.django_db
def test_seed_is_repeatable():
    ensure_demo_user(force=True)
    first = FoodEntry.objects.count()
    ensure_demo_user(force=True)
    assert FoodEntry.objects.count() == first


@pytest.mark.django_db
def test_demo_user_blocked_from_ai_features(client):
    token = client.post('/api/auth/demo-login/').data['token']
    headers = {'HTTP_AUTHORIZATION': f'Token {token}'}
    res = client.post('/api/logs/food/estimate/', {'name': 'eggs'},
                      content_type='application/json', **headers)
    assert res.status_code == 403
    res = client.post('/api/meals/generate/', content_type='application/json', **headers)
    assert res.status_code == 403
    res = client.post('/api/exercise/generate/', content_type='application/json', **headers)
    assert res.status_code == 403


@pytest.mark.django_db
def test_real_user_not_blocked_from_ai(client):
    User.objects.create_user(email='real@example.com', username='real', password='StrongPass123!')
    client.post('/api/auth/login/', {'email': 'real@example.com', 'password': 'StrongPass123!'},
                content_type='application/json')
    with patch('logs.claude_service.estimate_calories') as mock:
        mock.return_value = {'calories': 100, 'protein_g': 5, 'notes': ''}
        res = client.post('/api/logs/food/estimate/', {'name': 'eggs'}, content_type='application/json')
    assert res.status_code == 200


@pytest.mark.django_db
def test_demo_login_works_when_browser_already_has_a_session():
    from django.test import Client
    from django.contrib.auth import get_user_model
    User = get_user_model()
    other = User.objects.create_user(username='someone', email='someone@example.com', password='pw-12345-xyz')
    c = Client(enforce_csrf_checks=True)
    c.force_login(other)
    r = c.post('/api/auth/demo-login/')
    assert r.status_code == 200
    assert r.json()['token']
