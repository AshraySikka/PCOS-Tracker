import pytest
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone

from logs.models import DailyLog, FoodEntry, WaterEntry, ExerciseEntry

User = get_user_model()


@pytest.fixture
def user_client(client):
    user = User.objects.create_user(email='dash@example.com', username='dash', password='StrongPass123!')
    today = timezone.now().date()
    for offset, kcal in ((0, 500), (3, 700), (10, 600), (40, 800)):
        log = DailyLog.objects.create(user=user, date=today - timedelta(days=offset))
        FoodEntry.objects.create(log=log, meal_type='lunch', name='Rice', calories=kcal, protein_g=20)
        WaterEntry.objects.create(log=log, amount_ml=1000)
    ExerciseEntry.objects.create(log=DailyLog.objects.get(user=user, date=today), name='Walk', duration_mins=30, calories_burned=120)
    client.post('/api/auth/login/', {'email': 'dash@example.com', 'password': 'StrongPass123!'},
                content_type='application/json')
    return client


@pytest.mark.django_db
def test_dashboard_all_time_starts_at_first_entry(user_client):
    res = user_client.get('/api/reports/dashboard/?range=all')
    assert res.status_code == 200
    assert res.data['range'] == 'all'
    assert len(res.data['days']) == 41
    assert res.data['summary']['days_logged'] == 4
    assert res.data['summary']['avg_calories'] == 650
    assert res.data['previous'] is None


@pytest.mark.django_db
def test_dashboard_default_is_all_time(user_client):
    res = user_client.get('/api/reports/dashboard/')
    assert res.data['range'] == 'all'


@pytest.mark.django_db
def test_dashboard_seven_and_thirty_days(user_client):
    seven = user_client.get('/api/reports/dashboard/?range=7').data
    assert len(seven['days']) == 7
    assert seven['summary']['days_logged'] == 2
    assert seven['previous']['days_logged'] == 1
    thirty = user_client.get('/api/reports/dashboard/?range=30').data
    assert len(thirty['days']) == 30
    assert thirty['summary']['days_logged'] == 3
    assert thirty['summary']['total_exercise_mins'] == 30


@pytest.mark.django_db
def test_dashboard_streak_and_breakdowns(user_client):
    res = user_client.get('/api/reports/dashboard/?range=all').data
    assert res['streak']['current'] == 1
    assert res['streak']['longest'] == 1
    assert res['by_meal']['lunch'] == 2600
    assert res['top_foods'][0]['name'] == 'Rice'
    assert res['top_exercises'][0]['minutes'] == 30


@pytest.mark.django_db
def test_dashboard_empty_user(client):
    User.objects.create_user(email='new@example.com', username='new', password='StrongPass123!')
    client.post('/api/auth/login/', {'email': 'new@example.com', 'password': 'StrongPass123!'},
                content_type='application/json')
    res = client.get('/api/reports/dashboard/?range=all')
    assert res.status_code == 200
    assert len(res.data['days']) == 7
    assert res.data['summary']['days_logged'] == 0


@pytest.mark.django_db
def test_dashboard_unauthenticated(client):
    assert client.get('/api/reports/dashboard/').status_code in [401, 403]


@pytest.mark.django_db
def test_log_entries_can_target_a_past_date(user_client):
    past = (timezone.now().date() - timedelta(days=2)).isoformat()
    res = user_client.post('/api/logs/food/', {
        'meal_type': 'dinner', 'name': 'Soup', 'calories': 200, 'date': past,
    }, content_type='application/json')
    assert res.status_code == 201
    assert FoodEntry.objects.filter(log__date=past, name='Soup').exists()


@pytest.mark.django_db
def test_log_entries_reject_future_and_bad_dates(user_client):
    future = (timezone.now().date() + timedelta(days=2)).isoformat()
    res = user_client.post('/api/logs/water/', {'amount_ml': 250, 'date': future}, content_type='application/json')
    assert res.status_code == 400
    res = user_client.post('/api/logs/water/', {'amount_ml': 250, 'date': 'nope'}, content_type='application/json')
    assert res.status_code == 400
