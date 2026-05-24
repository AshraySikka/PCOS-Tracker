from django.db import models
from django.conf import settings

class DailyLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_logs'
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.email} - {self.date}"

    @property
    def total_calories(self):
        return sum(e.calories or 0 for e in self.food_entries.all())

    @property
    def total_protein(self):
        return sum(e.protein_g or 0 for e in self.food_entries.all())

    @property
    def total_water_ml(self):
        return sum(e.amount_ml or 0 for e in self.water_entries.all())

    @property
    def total_exercise_mins(self):
        return sum(e.duration_mins or 0 for e in self.exercise_entries.all())

    @property
    def total_calories_burned(self):
        return sum(e.calories_burned or 0 for e in self.exercise_entries.all())


class FoodEntry(models.Model):
    MEAL_TYPES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='food_entries')
    meal_type = models.CharField(max_length=10, choices=MEAL_TYPES)
    name = models.CharField(max_length=200)
    quantity = models.CharField(max_length=100, blank=True)
    calories = models.IntegerField(null=True, blank=True)
    protein_g = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    is_estimated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class ExerciseEntry(models.Model):
    log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='exercise_entries')
    name = models.CharField(max_length=200)
    duration_mins = models.IntegerField(default=0)
    calories_burned = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class WaterEntry(models.Model):
    log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='water_entries')
    amount_ml = models.IntegerField(default=250)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
