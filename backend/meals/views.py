from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from profiles.models import UserProfile
from .models import MealPlan, MealDay, Meal
from .serializers import MealPlanSerializer
from .claude_service import generate_meal_plan
from .unsplash_service import fetch_food_image

DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate(request):
    try:
        profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Complete your profile first'}, status=status.HTTP_400_BAD_REQUEST)

    if not profile.weight_kg or not profile.height_cm:
        return Response({'error': 'Add your weight and height first'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        plan_data = generate_meal_plan(profile)
    except Exception as e:
        return Response({'error': f'AI generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    plan = MealPlan.objects.create(
        user=request.user,
        week_start=plan_data.get('week_start', 'Monday'),
        daily_protein_target=plan_data.get('daily_protein_target'),
        per_meal_protein=plan_data.get('per_meal_protein'),
    )

    for i, day_data in enumerate(plan_data.get('days', [])):
        day_obj = MealDay.objects.create(
            plan=plan,
            day=day_data['day'],
            order=i
        )
        for meal_data in day_data.get('meals', []):
            image_url = fetch_food_image(meal_data.get('image_query', meal_data['name']))
            Meal.objects.create(
                day=day_obj,
                meal_type=meal_data['type'],
                name=meal_data['name'],
                description=meal_data.get('description', ''),
                protein_g=meal_data.get('protein_g', 0),
                calories=meal_data.get('calories', 0),
                ingredients=meal_data.get('ingredients', []),
                image_url=image_url,
                image_query=meal_data.get('image_query', ''),
            )

    serializer = MealPlanSerializer(plan)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current(request):
    plan = MealPlan.objects.filter(user=request.user).first()
    if not plan:
        return Response({'detail': 'No meal plan yet'}, status=status.HTTP_404_NOT_FOUND)
    serializer = MealPlanSerializer(plan)
    return Response(serializer.data)
