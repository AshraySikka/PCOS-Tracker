from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, date
from collections import defaultdict
from django.db.models import Sum, Count
from logs.models import DailyLog, FoodEntry, ExerciseEntry, WaterEntry

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

# ---------------------------------------------------------------------------
# Dashboard: one endpoint for the 7 day, 30 day and all time views
# ---------------------------------------------------------------------------
RANGE_DAYS = {'7': 7, '7d': 7, '30': 30, '30d': 30}


def _daily_totals(user, start, end):
    """Return {date: totals} for every date that has at least one entry."""
    totals = defaultdict(lambda: {
        'calories': 0, 'protein': 0.0, 'water_ml': 0,
        'exercise_mins': 0, 'calories_burned': 0,
    })

    food = FoodEntry.objects.filter(
        log__user=user, log__date__gte=start, log__date__lte=end
    ).values('log__date').annotate(cal=Sum('calories'), prot=Sum('protein_g'))
    for row in food:
        t = totals[row['log__date']]
        t['calories'] = row['cal'] or 0
        t['protein'] = float(row['prot'] or 0)

    water = WaterEntry.objects.filter(
        log__user=user, log__date__gte=start, log__date__lte=end
    ).values('log__date').annotate(ml=Sum('amount_ml'))
    for row in water:
        totals[row['log__date']]['water_ml'] = row['ml'] or 0

    exercise = ExerciseEntry.objects.filter(
        log__user=user, log__date__gte=start, log__date__lte=end
    ).values('log__date').annotate(mins=Sum('duration_mins'), burned=Sum('calories_burned'))
    for row in exercise:
        t = totals[row['log__date']]
        t['exercise_mins'] = row['mins'] or 0
        t['calories_burned'] = row['burned'] or 0

    return totals


def _first_entry_date(user):
    dates = []
    for model in (FoodEntry, WaterEntry, ExerciseEntry):
        first = model.objects.filter(log__user=user).order_by('log__date').values_list('log__date', flat=True).first()
        if first:
            dates.append(first)
    return min(dates) if dates else None


def _build_days(totals, start, end):
    days = []
    current = start
    while current <= end:
        t = totals.get(current)
        days.append({
            'date': current.isoformat(),
            'calories': t['calories'] if t else 0,
            'protein': round(t['protein'], 1) if t else 0,
            'water_ml': t['water_ml'] if t else 0,
            'exercise_mins': t['exercise_mins'] if t else 0,
            'calories_burned': t['calories_burned'] if t else 0,
            'logged': bool(t),
        })
        current += timedelta(days=1)
    return days


def _summarize(days):
    logged = [d for d in days if d['logged']]
    food_days = [d for d in days if d['calories'] > 0]
    water_days = [d for d in days if d['water_ml'] > 0]
    return {
        'days_in_range': len(days),
        'days_logged': len(logged),
        'avg_calories': round(sum(d['calories'] for d in food_days) / len(food_days)) if food_days else 0,
        'avg_protein': round(sum(d['protein'] for d in food_days) / len(food_days), 1) if food_days else 0,
        'avg_water_ml': round(sum(d['water_ml'] for d in water_days) / len(water_days)) if water_days else 0,
        'total_exercise_mins': sum(d['exercise_mins'] for d in days),
        'total_calories_burned': sum(d['calories_burned'] for d in days),
        'active_days': sum(1 for d in days if d['exercise_mins'] > 0),
    }


def _streaks(user, today):
    """Current and longest run of consecutive logged days (all time)."""
    dates = set()
    for model in (FoodEntry, WaterEntry, ExerciseEntry):
        dates.update(model.objects.filter(log__user=user).values_list('log__date', flat=True).distinct())
    if not dates:
        return {'current': 0, 'longest': 0}

    longest = run = 0
    prev = None
    for d in sorted(dates):
        run = run + 1 if prev and (d - prev).days == 1 else 1
        longest = max(longest, run)
        prev = d

    # Today does not have to be logged yet for a streak to still be alive.
    cursor = today if today in dates else today - timedelta(days=1)
    current = 0
    while cursor in dates:
        current += 1
        cursor -= timedelta(days=1)
    return {'current': current, 'longest': longest}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Aggregates for ?range=7, ?range=30 or ?range=all (default all)."""
    range_param = (request.query_params.get('range') or 'all').lower()
    today = timezone.now().date()
    user = request.user

    if range_param in RANGE_DAYS:
        span = RANGE_DAYS[range_param]
        start = today - timedelta(days=span - 1)
        range_key = str(span)
    else:
        range_key = 'all'
        first = _first_entry_date(user)
        start = first if first else today - timedelta(days=6)
        span = (today - start).days + 1

    totals = _daily_totals(user, start, today)
    days = _build_days(totals, start, today)

    previous = None
    if range_key != 'all':
        prev_end = start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=span - 1)
        prev_totals = _daily_totals(user, prev_start, prev_end)
        previous = _summarize(_build_days(prev_totals, prev_start, prev_end))

    by_meal = {m: 0 for m in ('breakfast', 'lunch', 'dinner', 'snack')}
    meal_rows = FoodEntry.objects.filter(
        log__user=user, log__date__gte=start, log__date__lte=today
    ).values('meal_type').annotate(cal=Sum('calories'))
    for row in meal_rows:
        by_meal[row['meal_type']] = row['cal'] or 0

    top_foods = [
        {'name': r['name'], 'count': r['n'], 'calories': r['cal'] or 0}
        for r in FoodEntry.objects.filter(
            log__user=user, log__date__gte=start, log__date__lte=today
        ).values('name').annotate(n=Count('id'), cal=Sum('calories')).order_by('-n', 'name')[:5]
    ]
    top_exercises = [
        {'name': r['name'], 'count': r['n'], 'minutes': r['mins'] or 0}
        for r in ExerciseEntry.objects.filter(
            log__user=user, log__date__gte=start, log__date__lte=today
        ).values('name').annotate(n=Count('id'), mins=Sum('duration_mins')).order_by('-mins', 'name')[:5]
    ]

    return Response({
        'range': range_key,
        'start_date': start.isoformat(),
        'end_date': today.isoformat(),
        'days': days,
        'summary': _summarize(days),
        'previous': previous,
        'streak': _streaks(user, today),
        'by_meal': by_meal,
        'top_foods': top_foods,
        'top_exercises': top_exercises,
    })
