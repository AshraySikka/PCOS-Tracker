import pytest
from django.contrib.auth import get_user_model

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
def test_get_preferences(auth_client):
    response = auth_client.get('/api/notifications/preferences/')
    assert response.status_code == 200
    assert 'meal_reminders' in response.data
    assert 'water_reminders' in response.data

@pytest.mark.django_db
def test_update_preferences(auth_client):
    response = auth_client.patch('/api/notifications/preferences/', {
        'meal_reminders': False,
        'water_interval_hours': 3
    }, content_type='application/json')
    assert response.status_code == 200
    check = auth_client.get('/api/notifications/preferences/')
    assert check.data['meal_reminders'] == False
    assert check.data['water_interval_hours'] == 3

@pytest.mark.django_db
def test_subscribe(auth_client):
    response = auth_client.post('/api/notifications/subscribe/', {
        'endpoint': 'https://fcm.googleapis.com/test123',
        'keys': {'p256dh': 'testkey', 'auth': 'testauth'}
    }, content_type='application/json')
    assert response.status_code == 200

@pytest.mark.django_db
def test_vapid_key(auth_client):
    response = auth_client.get('/api/notifications/vapid-key/')
    assert response.status_code == 200
    assert 'public_key' in response.data

@pytest.mark.django_db
def test_preferences_unauthenticated(client):
    response = client.get('/api/notifications/preferences/')
    assert response.status_code == 403
