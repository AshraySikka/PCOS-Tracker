import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from logs.models import DailyLog, FoodEntry, WaterEntry

User = get_user_model()

@pytest.fixture
def auth_client(client):
    user = User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    log = DailyLog.objects.create(user=user, date=timezone.now().date())
    FoodEntry.objects.create(log=log, meal_type='breakfast', name='Eggs', calories=180, protein_g=14)
    FoodEntry.objects.create(log=log, meal_type='lunch', name='Chicken', calories=300, protein_g=35)
    WaterEntry.objects.create(log=log, amount_ml=500)
    client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    return client

@pytest.mark.django_db
def test_weekly_report(auth_client):
    response = auth_client.get('/api/reports/weekly/')
    assert response.status_code == 200
    assert 'days' in response.data
    assert 'summary' in response.data
    assert len(response.data['days']) == 7
    assert response.data['summary']['days_logged'] == 1

@pytest.mark.django_db
def test_monthly_report(auth_client):
    response = auth_client.get('/api/reports/monthly/')
    assert response.status_code == 200
    assert 'days' in response.data
    assert response.data['summary']['avg_calories'] == 480

@pytest.mark.django_db
def test_reports_unauthenticated(client):
    response = client.get('/api/reports/weekly/')
    assert response.status_code in [401, 403]
