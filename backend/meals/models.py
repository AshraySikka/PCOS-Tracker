from django.db import models
from django.conf import settings

class MealPlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meal_plans'
    )
    week_start = models.CharField(max_length=20, default='Monday')
    daily_protein_target = models.IntegerField(null=True, blank=True)
    per_meal_protein = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Meal plan for {self.user.email} - {self.created_at.date()}"

class MealDay(models.Model):
    plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='days')
    day = models.CharField(max_length=10)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class Meal(models.Model):
    MEAL_TYPES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
    ]
    day = models.ForeignKey(MealDay, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.CharField(max_length=10, choices=MEAL_TYPES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    protein_g = models.IntegerField(default=0)
    calories = models.IntegerField(default=0)
    ingredients = models.JSONField(default=list)
    image_url = models.URLField(blank=True, default='')
    image_query = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['meal_type']
