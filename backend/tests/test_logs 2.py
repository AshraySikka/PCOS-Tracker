import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

@pytest.fixture
def auth_client(client):
    User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    return client

@pytest.mark.django_db
def test_get_today_log(auth_client):
    response = auth_client.get('/api/logs/today/')
    assert response.status_code == 200
    assert 'food_entries' in response.data
    assert 'water_entries' in response.data
    assert 'exercise_entries' in response.data

@pytest.mark.django_db
def test_add_food_entry(auth_client):
    response = auth_client.post('/api/logs/food/', {
        'meal_type': 'breakfast',
        'name': 'Scrambled eggs',
        'quantity': '2 eggs',
        'calories': 180,
        'protein_g': '14.0'
    }, content_type='application/json')
    assert response.status_code == 201
    assert response.data['name'] == 'Scrambled eggs'

@pytest.mark.django_db
def test_add_water_entry(auth_client):
    response = auth_client.post('/api/logs/water/', {
        'amount_ml': 250
    }, content_type='application/json')
    assert response.status_code == 201
    assert response.data['amount_ml'] == 250

@pytest.mark.django_db
def test_add_exercise_entry(auth_client):
    response = auth_client.post('/api/logs/exercise/', {
        'name': 'Morning walk',
        'duration_mins': 30,
        'calories_burned': 150
    }, content_type='application/json')
    assert response.status_code == 201
    assert response.data['duration_mins'] == 30

@pytest.mark.django_db
def test_daily_totals(auth_client):
    auth_client.post('/api/logs/food/', {
        'meal_type': 'breakfast',
        'name': 'Eggs',
        'calories': 180,
        'protein_g': '14.0'
    }, content_type='application/json')
    auth_client.post('/api/logs/food/', {
        'meal_type': 'lunch',
        'name': 'Chicken',
        'calories': 300,
        'protein_g': '35.0'
    }, content_type='application/json')
    auth_client.post('/api/logs/water/', {'amount_ml': 500}, content_type='application/json')
    response = auth_client.get('/api/logs/today/')
    assert response.data['total_calories'] == 480
    assert response.data['total_water_ml'] == 500

@pytest.mark.django_db
def test_delete_food_entry(auth_client):
    res = auth_client.post('/api/logs/food/', {
        'meal_type': 'breakfast',
        'name': 'Toast',
        'calories': 120,
        'protein_g': '4.0'
    }, content_type='application/json')
    entry_id = res.data['id']
    del_res = auth_client.delete(f'/api/logs/food/{entry_id}/')
    assert del_res.status_code == 204

@pytest.mark.django_db
def test_log_unauthenticated(client):
    response = client.get('/api/logs/today/')
    assert response.status_code == 403

@pytest.mark.django_db
@patch('logs.claude_service.estimate_calories')
def test_estimate_food(mock_estimate, auth_client):
    mock_estimate.return_value = {'calories': 180, 'protein_g': 14.0, 'notes': 'Standard serving'}
    response = auth_client.post('/api/logs/food/estimate/', {
        'name': 'scrambled eggs',
        'quantity': '2 eggs'
    }, content_type='application/json')
    assert response.status_code == 200
    assert response.data['calories'] == 180
