from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyLog, FoodEntry, ExerciseEntry, WaterEntry
from .serializers import (
    DailyLogSerializer, FoodEntrySerializer,
    ExerciseEntrySerializer, WaterEntrySerializer
)

def get_or_create_log(user, date=None):
    if date is None:
        date = timezone.now().date()
    log, _ = DailyLog.objects.get_or_create(user=user, date=date)
    return log

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today(request):
    log = get_or_create_log(request.user)
    return Response(DailyLogSerializer(log).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def by_date(request):
    date_str = request.query_params.get('date')
    if not date_str:
        return Response({'error': 'date parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        from datetime import date
        log_date = date.fromisoformat(date_str)
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    log = get_or_create_log(request.user, log_date)
    return Response(DailyLogSerializer(log).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_food(request):
    log = get_or_create_log(request.user)
    serializer = FoodEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(log=log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_food(request, pk):
    try:
        entry = FoodEntry.objects.get(pk=pk, log__user=request.user)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except FoodEntry.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_exercise(request):
    log = get_or_create_log(request.user)
    serializer = ExerciseEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(log=log)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_exercise(request, pk):
    try:
        entry = ExerciseEntry.objects.get(pk=pk, log__user=request.user)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ExerciseEntry.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_water(request):
    log = get_or_create_log(request.user)
    amount_ml = request.data.get('amount_ml', 250)
    entry = WaterEntry.objects.create(log=log, amount_ml=amount_ml)
    return Response(WaterEntrySerializer(entry).data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_water(request, pk):
    try:
        entry = WaterEntry.objects.get(pk=pk, log__user=request.user)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except WaterEntry.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def estimate_food(request):
    name = request.data.get('name', '')
    quantity = request.data.get('quantity', '')
    if not name:
        return Response({'error': 'Food name required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        from .claude_service import estimate_calories
        result = estimate_calories(name, quantity)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
