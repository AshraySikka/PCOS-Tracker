import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from profiles.models import UserProfile

User = get_user_model()

MOCK_PLAN = {
    "week_start": "Monday",
    "daily_protein_target": 65,
    "per_meal_protein": 22,
    "days": [
        {
            "day": "Monday",
            "meals": [
                {
                    "type": "breakfast",
                    "name": "Scrambled Eggs with Spinach",
                    "description": "High protein breakfast",
                    "protein_g": 22,
                    "calories": 320,
                    "ingredients": ["eggs", "spinach", "olive oil"],
                    "image_query": "scrambled eggs spinach"
                },
                {
                    "type": "lunch",
                    "name": "Grilled Chicken Salad",
                    "description": "Light and filling",
                    "protein_g": 35,
                    "calories": 420,
                    "ingredients": ["chicken", "lettuce", "tomato"],
                    "image_query": "grilled chicken salad"
                },
                {
                    "type": "dinner",
                    "name": "Lentil Dal with Rice",
                    "description": "High fibre dinner",
                    "protein_g": 25,
                    "calories": 480,
                    "ingredients": ["lentils", "rice", "spices"],
                    "image_query": "lentil dal rice"
                }
            ]
        }
    ]
}

@pytest.fixture
def auth_client(client):
    user = User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='StrongPass123!'
    )
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.weight_kg = 65
    profile.height_cm = 163
    profile.age = 28
    profile.cuisine_preferences = ['Indian']
    profile.symptoms = ['Fatigue']
    profile.save()
    client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    return client

@pytest.mark.django_db
@patch('meals.views.generate_meal_plan')
@patch('meals.views.fetch_food_image')
def test_generate_meal_plan(mock_image, mock_generate, auth_client):
    mock_generate.return_value = MOCK_PLAN
    mock_image.return_value = 'https://images.unsplash.com/test.jpg'
    response = auth_client.post('/api/meals/generate/')
    assert response.status_code == 201
    assert 'days' in response.data
    assert len(response.data['days']) == 1

@pytest.mark.django_db
def test_current_meal_plan_empty(auth_client):
    response = auth_client.get('/api/meals/current/')
    assert response.status_code == 404

@pytest.mark.django_db
@patch('meals.views.generate_meal_plan')
@patch('meals.views.fetch_food_image')
def test_current_meal_plan_after_generate(mock_image, mock_generate, auth_client):
    mock_generate.return_value = MOCK_PLAN
    mock_image.return_value = ''
    auth_client.post('/api/meals/generate/')
    response = auth_client.get('/api/meals/current/')
    assert response.status_code == 200
    assert response.data['daily_protein_target'] == 65

@pytest.mark.django_db
def test_generate_unauthenticated(client):
    response = client.post('/api/meals/generate/')
    assert response.status_code in [401, 403]
