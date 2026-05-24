import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from profiles.models import UserProfile

User = get_user_model()

MOCK_PLAN = {
    "weekly_summary": "A balanced PCOS-friendly workout plan combining strength and cardio.",
    "days": [
        {
            "day": "Monday",
            "type": "strength",
            "title": "Lower Body Strength",
            "duration_mins": 35,
            "intensity": "moderate",
            "exercises": [
                {
                    "name": "Bodyweight Squats",
                    "sets": 3,
                    "reps": "12-15",
                    "duration_secs": None,
                    "notes": "Keep knees aligned",
                    "youtube_query": "bodyweight squats beginners"
                }
            ]
        },
        {
            "day": "Tuesday",
            "type": "rest",
            "title": "Rest Day",
            "duration_mins": 0,
            "intensity": "none",
            "exercises": []
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
    profile.save()
    client.post('/api/auth/login/', {
        'email': 'test@example.com',
        'password': 'StrongPass123!'
    }, content_type='application/json')
    return client

@pytest.mark.django_db
@patch('exercise.views.generate_exercise_plan')
def test_generate_exercise_plan(mock_generate, auth_client):
    mock_generate.return_value = MOCK_PLAN
    response = auth_client.post('/api/exercise/generate/')
    assert response.status_code == 201
    assert 'days' in response.data
    assert len(response.data['days']) == 2

@pytest.mark.django_db
def test_current_exercise_plan_empty(auth_client):
    response = auth_client.get('/api/exercise/current/')
    assert response.status_code == 404

@pytest.mark.django_db
@patch('exercise.views.generate_exercise_plan')
def test_current_after_generate(mock_generate, auth_client):
    mock_generate.return_value = MOCK_PLAN
    auth_client.post('/api/exercise/generate/')
    response = auth_client.get('/api/exercise/current/')
    assert response.status_code == 200
    assert 'weekly_summary' in response.data

@pytest.mark.django_db
def test_youtube_url_generated(auth_client):
    from exercise.models import ExercisePlan, ExerciseDay, Exercise
    from django.contrib.auth import get_user_model
    user = get_user_model().objects.get(email='test@example.com')
    plan = ExercisePlan.objects.create(user=user, weekly_summary='test')
    day = ExerciseDay.objects.create(plan=plan, day='Monday', title='Test', order=0)
    ex = Exercise.objects.create(day=day, name='Squats', youtube_query='squats for beginners')
    assert 'youtube.com' in ex.youtube_url
    assert 'squats+for+beginners' in ex.youtube_url

@pytest.mark.django_db
def test_generate_unauthenticated(client):
    response = client.post('/api/exercise/generate/')
    assert response.status_code == 403
