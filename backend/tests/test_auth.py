import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_register_success(client):
    response = client.post('/api/auth/register/', {
        'email': 'test@example.com',
        'username': 'testuser',
        'password': 'StrongPass123!',
        'password2': 'StrongPass123!'
    }, content_type='application/json')
    assert response.status_code == 201
    assert response.data['email'] == 'test@example.com'

@pytest.mark.django_db
def test_register_password_mismatch(client):
    response = client.post('/api/auth/register/', {
        'email': 'test@example.com',
        'username': 'testuser',
        'password': 'StrongPass123!',
        'password2': 'WrongPass123!'
    }, content_type='application/json')
    assert response.status_code == 400

@pytest.mark.django_db
def test_register_duplicate_email(client):
    User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    response = client.post('/api/auth/register/', {
        'email': 'test@example.com',
        'username': 'testuser2',
        'password': 'StrongPass123!',
        'password2': 'StrongPass123!'
    }, content_type='application/json')
    assert response.status_code == 400

@pytest.mark.django_db
def test_login_success(client):
    User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    response = client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    assert response.status_code == 200
    assert response.data['email'] == 'test@example.com'

@pytest.mark.django_db
def test_login_invalid_credentials(client):
    response = client.post('/api/auth/login/', {
        'email': 'wrong@example.com',
        'password': 'WrongPass123!'
    }, content_type='application/json')
    assert response.status_code == 401

@pytest.mark.django_db
def test_logout(client):
    User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    response = client.post('/api/auth/logout/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_me_authenticated(client):
    User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    response = client.get('/api/auth/me/')
    assert response.status_code == 200
    assert response.data['email'] == 'test@example.com'

@pytest.mark.django_db
def test_me_unauthenticated(client):
    response = client.get('/api/auth/me/')
    assert response.status_code in [401, 403]
