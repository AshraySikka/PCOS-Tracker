"""Builds realistic demo data for Jane.

Everything is derived from the calendar date, so running the seed twice on the
same day produces identical data. Data always ends on `today`, so the demo
opens on a date that has entries and the 7 day, 30 day and all time ranges are
never empty.
"""
import random
from datetime import datetime, time, timedelta, timezone as dt_timezone

from django.db import transaction
from django.utils import timezone as dj_timezone

from logs.models import DailyLog, FoodEntry, ExerciseEntry, WaterEntry
from profiles.models import UserProfile
from meals.models import MealPlan, MealDay, Meal
from exercise.models import ExercisePlan, ExerciseDay, Exercise
from notifications.models import NotificationPreference

SEED_DAYS = 150
ACTIVE_STREAK_DAYS = 11  # the most recent days are always logged

# (name, quantity, kcal, protein_g)
FOODS = {
    'breakfast': [
        ('Greek yogurt with berries', '1 cup', 190, 17.0),
        ('Veggie omelette', '2 eggs', 240, 15.0),
        ('Overnight oats with chia', '1 bowl', 310, 12.0),
        ('Besan chilla', '2 pieces', 260, 14.0),
        ('Avocado toast with egg', '1 slice', 330, 13.0),
        ('Moong dal cheela', '2 pieces', 230, 13.0),
        ('Protein smoothie', '1 glass', 280, 24.0),
    ],
    'lunch': [
        ('Grilled chicken salad', '1 large bowl', 420, 38.0),
        ('Lentil soup with brown rice', '1 bowl', 440, 21.0),
        ('Chickpea and spinach curry', '1 cup', 380, 17.0),
        ('Paneer tikka wrap', '1 wrap', 460, 24.0),
        ('Quinoa bowl with roasted veg', '1 bowl', 410, 15.0),
        ('Tofu stir fry', '1 plate', 390, 25.0),
        ('Rajma with cauliflower rice', '1 plate', 400, 18.0),
    ],
    'dinner': [
        ('Baked salmon with greens', '1 fillet', 480, 36.0),
        ('Chicken tikka with salad', '1 plate', 450, 40.0),
        ('Dal and sauteed vegetables', '1 plate', 360, 19.0),
        ('Turkey meatballs with zucchini noodles', '1 plate', 420, 34.0),
        ('Vegetable khichdi', '1 bowl', 350, 13.0),
        ('Egg curry with a small roti', '1 plate', 430, 24.0),
        ('Grilled fish with quinoa', '1 plate', 440, 35.0),
    ],
    'snack': [
        ('Almonds', 'small handful', 120, 4.5),
        ('Apple with peanut butter', '1 apple', 190, 5.0),
        ('Roasted chana', '1/2 cup', 130, 7.0),
        ('Cottage cheese with cucumber', '1/2 cup', 110, 12.0),
        ('Boiled egg', '1 egg', 75, 6.5),
        ('Walnuts', '6 halves', 90, 2.0),
        ('Hummus with carrot sticks', '1/4 cup', 140, 5.0),
    ],
}

MEAL_HOURS = {'breakfast': 8, 'lunch': 13, 'dinner': 19, 'snack': 16}

# (name, min_minutes, max_minutes, kcal_per_minute)
WORKOUTS = [
    ('Morning walk', 25, 50, 4.2),
    ('Yoga flow', 25, 45, 3.2),
    ('Strength training', 30, 50, 6.0),
    ('Cycling', 25, 45, 7.0),
    ('Pilates', 30, 45, 4.5),
    ('Evening walk', 20, 40, 4.0),
]


def _at(day, hour, minute):
    return datetime.combine(day, time(hour, minute), tzinfo=dt_timezone.utc)


def _day_rows(day, index, total, rng):
    """Return (food, exercise, water) lists of unsaved model kwargs for a day."""
    # Habits improve a little over the five months, which makes the
    # all time trend line worth looking at.
    progress = index / max(total - 1, 1)
    weekend = day.weekday() >= 5

    food = []
    for meal_type in ('breakfast', 'lunch', 'dinner'):
        name, qty, kcal, protein = rng.choice(FOODS[meal_type])
        kcal = round(kcal * rng.uniform(1.12, 1.32))
        protein = round(protein * (0.9 + 0.2 * progress) * rng.uniform(0.95, 1.08), 1)
        food.append((meal_type, name, qty, kcal, protein, rng.random() < 0.18))
    for _ in range(rng.choice([1, 1, 2]) if not weekend else rng.choice([1, 2, 2])):
        name, qty, kcal, protein = rng.choice(FOODS['snack'])
        food.append(('snack', name, qty, kcal, round(protein, 1), rng.random() < 0.18))

    exercise = []
    chance = 0.45 + 0.25 * progress + (0.15 if weekend else 0)
    if rng.random() < chance:
        name, lo, hi, kpm = rng.choice(WORKOUTS)
        mins = rng.randrange(lo, hi + 1, 5)
        exercise.append((name, mins, round(mins * kpm)))

    target_ml = 1700 + 800 * progress + rng.uniform(-350, 450)
    water = []
    total_ml = 0
    amounts = [150, 250, 250, 350, 500]
    while total_ml < target_ml:
        ml = rng.choice(amounts)
        water.append(ml)
        total_ml += ml
    return food, exercise, water


@transaction.atomic
def seed_demo_data(user, today=None, days=SEED_DAYS):
    today = today or dj_timezone.now().date()

    # Start clean so the seed can be re-run safely.
    DailyLog.objects.filter(user=user).delete()
    MealPlan.objects.filter(user=user).delete()
    ExercisePlan.objects.filter(user=user).delete()

    UserProfile.objects.update_or_create(
        user=user,
        defaults={
            'age': 29,
            'weight_kg': '68.0',
            'height_cm': '165.0',
            'activity_level': 'lightly_active',
            'symptoms': ['Irregular periods', 'Fatigue', 'Sugar cravings', 'Bloating'],
            'cuisine_preferences': ['Indian', 'Mediterranean', 'Japanese'],
            'food_items': 'eggs, paneer, chickpeas, lentils, spinach, yogurt, oats, almonds, salmon, quinoa',
            'goal': 'Steadier energy and more regular cycles',
        },
    )
    NotificationPreference.objects.get_or_create(user=user)

    start = today - timedelta(days=days - 1)
    logs = []
    plans = {}
    for i in range(days):
        day = start + timedelta(days=i)
        rng = random.Random(day.toordinal())
        days_from_end = (today - day).days
        # Miss roughly one day in eight, except in the recent streak window.
        skipped = days_from_end >= ACTIVE_STREAK_DAYS and rng.random() < 0.13
        if skipped:
            continue
        plans[day] = _day_rows(day, i, days, rng)
        logs.append(DailyLog(user=user, date=day))

    DailyLog.objects.bulk_create(logs)
    by_date = {l.date: l for l in DailyLog.objects.filter(user=user)}

    foods, exercises, waters = [], [], []
    for day, (food, exercise, water) in plans.items():
        log = by_date[day]
        for k, (meal_type, name, qty, kcal, protein, estimated) in enumerate(food):
            foods.append(FoodEntry(
                log=log, meal_type=meal_type, name=name, quantity=qty,
                calories=kcal, protein_g=protein, is_estimated=estimated,
            ))
        for name, mins, burned in exercise:
            exercises.append(ExerciseEntry(
                log=log, name=name, duration_mins=mins, calories_burned=burned,
            ))
        for k, ml in enumerate(water):
            waters.append(WaterEntry(log=log, amount_ml=ml))

    FoodEntry.objects.bulk_create(foods)
    ExerciseEntry.objects.bulk_create(exercises)
    WaterEntry.objects.bulk_create(waters)

    # created_at is auto_now_add, so spread the timestamps out afterwards.
    # The Log page shows the time of each water entry.
    _spread_timestamps(user)
    _seed_plans(user)
    return len(logs)


def _spread_timestamps(user):
    food_rows = list(FoodEntry.objects.filter(log__user=user).select_related('log'))
    for k, f in enumerate(food_rows):
        hour = MEAL_HOURS[f.meal_type]
        f.created_at = _at(f.log.date, hour, (k * 7) % 40)
    FoodEntry.objects.bulk_update(food_rows, ['created_at'], batch_size=500)

    ex_rows = list(ExerciseEntry.objects.filter(log__user=user).select_related('log'))
    for k, e in enumerate(ex_rows):
        e.created_at = _at(e.log.date, 7 if 'Morning' in e.name or 'Yoga' in e.name else 18, (k * 11) % 45)
    ExerciseEntry.objects.bulk_update(ex_rows, ['created_at'], batch_size=500)

    water_rows = list(
        WaterEntry.objects.filter(log__user=user).select_related('log').order_by('log__date', 'id')
    )
    per_day = {}
    for w in water_rows:
        per_day.setdefault(w.log_id, []).append(w)
    for entries in per_day.values():
        n = len(entries)
        for j, w in enumerate(entries):
            minutes = 8 * 60 + round(j * (12 * 60) / max(n, 1))
            w.created_at = _at(w.log.date, minutes // 60, minutes % 60)
    WaterEntry.objects.bulk_update(water_rows, ['created_at'], batch_size=500)


def _seed_plans(user):
    plan = MealPlan.objects.create(user=user, week_start='Monday', daily_protein_target=68, per_meal_protein=23)
    meal_days = [
        ('Monday', [
            ('breakfast', 'Greek yogurt bowl with berries and chia', 'Thick yogurt, mixed berries, chia seeds and a few almonds.', 24, 320, ['Greek yogurt', 'Mixed berries', 'Chia seeds', 'Almonds']),
            ('lunch', 'Chickpea and spinach curry with brown rice', 'A low GI curry with plenty of fibre and plant protein.', 22, 480, ['Chickpeas', 'Spinach', 'Tomato', 'Brown rice', 'Cumin']),
            ('dinner', 'Baked salmon with roasted vegetables', 'Omega 3 rich fish with broccoli and sweet potato.', 34, 520, ['Salmon', 'Broccoli', 'Sweet potato', 'Olive oil']),
        ]),
        ('Tuesday', [
            ('breakfast', 'Veggie omelette with whole grain toast', 'Three eggs with peppers and spinach.', 25, 360, ['Eggs', 'Bell pepper', 'Spinach', 'Whole grain bread']),
            ('lunch', 'Quinoa bowl with grilled paneer', 'Quinoa, paneer, cucumber, tomato and a lemon dressing.', 26, 470, ['Quinoa', 'Paneer', 'Cucumber', 'Tomato', 'Lemon']),
            ('dinner', 'Lentil soup with a side salad', 'Red lentils simmered with turmeric, ginger and carrots.', 21, 390, ['Red lentils', 'Carrot', 'Turmeric', 'Ginger', 'Mixed greens']),
        ]),
        ('Wednesday', [
            ('breakfast', 'Besan chilla with mint chutney', 'Chickpea flour pancakes with onion and coriander.', 20, 300, ['Besan', 'Onion', 'Coriander', 'Mint']),
            ('lunch', 'Chicken tikka salad', 'Grilled chicken over crunchy greens with a yogurt dressing.', 38, 430, ['Chicken breast', 'Lettuce', 'Cucumber', 'Yogurt']),
            ('dinner', 'Tofu stir fry with cauliflower rice', 'Tofu, broccoli and snap peas with ginger and garlic.', 27, 400, ['Tofu', 'Broccoli', 'Snap peas', 'Cauliflower rice']),
        ]),
    ]
    for order, (day, meals) in enumerate(meal_days):
        md = MealDay.objects.create(plan=plan, day=day, order=order)
        for mtype, name, desc, protein, kcal, ingredients in meals:
            Meal.objects.create(
                day=md, meal_type=mtype, name=name, description=desc,
                protein_g=protein, calories=kcal, ingredients=ingredients,
            )

    ex_plan = ExercisePlan.objects.create(
        user=user,
        weekly_summary='Three days a week: strength, low impact cardio and yoga, with walks on the days in between.',
    )
    ex_days = [
        ('Monday', 'strength', 'Lower body strength', 40, 'moderate', [
            ('Goblet squat', 3, '12', None, 'Keep your chest up and push through your heels.'),
            ('Glute bridge', 3, '15', None, 'Pause for a second at the top.'),
            ('Reverse lunge', 3, '10 each side', None, 'Slow and controlled on the way down.'),
        ]),
        ('Tuesday', 'walk', 'Brisk walk', 30, 'low', [
            ('Brisk walk', None, '', 1800, 'Aim for a pace where you can talk but not sing.'),
        ]),
        ('Wednesday', 'yoga', 'Yoga for stress and cycle support', 35, 'low', [
            ('Sun salutation', 3, '', None, 'Move with your breath.'),
            ('Pigeon pose', 2, '', 60, 'Hold each side for a minute.'),
            ('Child pose', 1, '', 90, 'Finish with deep belly breathing.'),
        ]),
    ]
    for order, (day, dtype, title, mins, intensity, exs) in enumerate(ex_days):
        ed = ExerciseDay.objects.create(
            plan=ex_plan, day=day, type=dtype, title=title,
            duration_mins=mins, intensity=intensity, order=order,
        )
        for name, sets, reps, secs, notes in exs:
            Exercise.objects.create(
                day=ed, name=name, sets=sets, reps=reps, duration_secs=secs,
                notes=notes, youtube_query=f'{name} how to',
            )
