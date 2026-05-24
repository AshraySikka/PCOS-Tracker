from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from profiles.models import UserProfile
from .models import ExercisePlan, ExerciseDay, Exercise
from .serializers import ExercisePlanSerializer
from .claude_service import generate_exercise_plan

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
        plan_data = generate_exercise_plan(profile)
    except Exception as e:
        return Response({'error': f'AI generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    plan = ExercisePlan.objects.create(
        user=request.user,
        weekly_summary=plan_data.get('weekly_summary', ''),
    )

    for i, day_data in enumerate(plan_data.get('days', [])):
        day_obj = ExerciseDay.objects.create(
            plan=plan,
            day=day_data['day'],
            type=day_data.get('type', 'mixed'),
            title=day_data.get('title', ''),
            duration_mins=day_data.get('duration_mins', 0),
            intensity=day_data.get('intensity', ''),
            order=i
        )
        for ex_data in day_data.get('exercises', []):
            Exercise.objects.create(
                day=day_obj,
                name=ex_data['name'],
                sets=ex_data.get('sets'),
                reps=ex_data.get('reps', ''),
                duration_secs=ex_data.get('duration_secs'),
                notes=ex_data.get('notes', ''),
                youtube_query=ex_data.get('youtube_query', ''),
            )

    serializer = ExercisePlanSerializer(plan)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current(request):
    plan = ExercisePlan.objects.filter(user=request.user).first()
    if not plan:
        return Response({'detail': 'No exercise plan yet'}, status=status.HTTP_404_NOT_FOUND)
    serializer = ExercisePlanSerializer(plan)
    return Response(serializer.data)
