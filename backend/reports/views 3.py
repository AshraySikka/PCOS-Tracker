from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, date
from logs.models import DailyLog

def get_log_data(user, start_date, end_date):
    logs = DailyLog.objects.filter(
        user=user,
        date__gte=start_date,
        date__lte=end_date
    ).prefetch_related('food_entries', 'exercise_entries', 'water_entries')

    days = []
    current = start_date
    while current <= end_date:
        log = next((l for l in logs if l.date == current), None)
        days.append({
            'date': current.isoformat(),
            'calories': log.total_calories if log else 0,
            'protein': float(log.total_protein) if log else 0,
            'water_ml': log.total_water_ml if log else 0,
            'exercise_mins': log.total_exercise_mins if log else 0,
            'calories_burned': log.total_calories_burned if log else 0,
        })
        current += timedelta(days=1)

    return days

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weekly(request):
    today = timezone.now().date()
    start = today - timedelta(days=6)
    days = get_log_data(request.user, start, today)

    logged_days = [d for d in days if d['calories'] > 0]
    avg_calories = round(sum(d['calories'] for d in logged_days) / len(logged_days)) if logged_days else 0
    avg_protein = round(sum(d['protein'] for d in logged_days) / len(logged_days), 1) if logged_days else 0
    avg_water = round(sum(d['water_ml'] for d in logged_days) / len(logged_days)) if logged_days else 0
    total_exercise = sum(d['exercise_mins'] for d in days)

    return Response({
        'period': 'weekly',
        'start_date': start.isoformat(),
        'end_date': today.isoformat(),
        'days': days,
        'summary': {
            'avg_calories': avg_calories,
            'avg_protein': avg_protein,
            'avg_water_ml': avg_water,
            'total_exercise_mins': total_exercise,
            'days_logged': len(logged_days),
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly(request):
    today = timezone.now().date()
    start = today.replace(day=1)
    days = get_log_data(request.user, start, today)

    logged_days = [d for d in days if d['calories'] > 0]
    avg_calories = round(sum(d['calories'] for d in logged_days) / len(logged_days)) if logged_days else 0
    avg_protein = round(sum(d['protein'] for d in logged_days) / len(logged_days), 1) if logged_days else 0
    total_exercise = sum(d['exercise_mins'] for d in days)

    return Response({
        'period': 'monthly',
        'start_date': start.isoformat(),
        'end_date': today.isoformat(),
        'days': days,
        'summary': {
            'avg_calories': avg_calories,
            'avg_protein': avg_protein,
            'total_exercise_mins': total_exercise,
            'days_logged': len(logged_days),
        }
    })