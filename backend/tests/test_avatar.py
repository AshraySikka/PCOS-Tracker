import pytest
from unittest.mock import patch, MagicMock
from django.core.files.uploadedfile import SimpleUploadedFile
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
@patch('profiles.views.upload_avatar')
def test_avatar_upload_success(mock_upload, auth_client):
    mock_upload.return_value = 'https://supabase.co/storage/avatars/test.jpg'
    image = SimpleUploadedFile('test.jpg', b'fakeimagecontent', content_type='image/jpeg')
    response = auth_client.post('/api/profile/avatar/', {'avatar': image})
    assert response.status_code == 200
    assert 'avatar_url' in response.data

@pytest.mark.django_db
def test_avatar_upload_no_file(auth_client):
    response = auth_client.post('/api/profile/avatar/')
    assert response.status_code == 400

@pytest.mark.django_db
@patch('profiles.views.upload_avatar')
def test_avatar_upload_too_large(mock_upload, auth_client):
    large_file = SimpleUploadedFile('big.jpg', b'x' * (6 * 1024 * 1024), content_type='image/jpeg')
    response = auth_client.post('/api/profile/avatar/', {'avatar': large_file})
    assert response.status_code == 400
    assert 'too large' in response.data['error']

@pytest.mark.django_db
def test_avatar_unauthenticated(client):
    response = client.post('/api/profile/avatar/')
    assert response.status_code == 403
