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
def test_get_profile(auth_client):
    response = auth_client.get('/api/profile/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_update_profile(auth_client):
    response = auth_client.patch('/api/profile/', {
        'age': 28,
        'weight_kg': '65.0',
        'height_cm': '163.0',
        'activity_level': 'lightly_active',
        'symptoms': ['irregular_periods', 'fatigue'],
        'cuisine_preferences': ['indian', 'mediterranean']
    }, content_type='application/json')
    assert response.status_code == 200
    assert response.data['age'] == 28

@pytest.mark.django_db
def test_bmi_calculation(auth_client):
    auth_client.patch('/api/profile/', {
        'weight_kg': '80.0',
        'height_cm': '163.0',
    }, content_type='application/json')
    response = auth_client.get('/api/profile/metrics/')
    assert response.status_code == 200
    assert response.data['bmi'] == 30.1

@pytest.mark.django_db
def test_protein_target(auth_client):
    auth_client.patch('/api/profile/', {
        'weight_kg': '80.0',
    }, content_type='application/json')
    response = auth_client.get('/api/profile/metrics/')
    assert response.data['protein_target_g'] == 80
    assert response.data['per_meal_protein_g'] == 27

@pytest.mark.django_db
def test_profile_unauthenticated(client):
    response = client.get('/api/profile/')
    assert response.status_code == 403
