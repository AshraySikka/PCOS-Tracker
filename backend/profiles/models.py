from django.db import models
from django.conf import settings

class ActivityLevel(models.TextChoices):
    SEDENTARY = 'sedentary', 'Sedentary'
    LIGHTLY_ACTIVE = 'lightly_active', 'Lightly Active'
    MODERATELY_ACTIVE = 'moderately_active', 'Moderately Active'
    VERY_ACTIVE = 'very_active', 'Very Active'

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    age = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    activity_level = models.CharField(
        max_length=20,
        choices=ActivityLevel.choices,
        default=ActivityLevel.SEDENTARY
    )
    symptoms = models.JSONField(default=list, blank=True)
    cuisine_preferences = models.JSONField(default=list, blank=True)
    food_items = models.TextField(blank=True, default='')
    goal = models.TextField(blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"

    @property
    def bmi(self):
        if self.weight_kg and self.height_cm and self.height_cm > 0:
            height_m = float(self.height_cm) / 100
            return round(float(self.weight_kg) / (height_m ** 2), 1)
        return None

    @property
    def protein_target_g(self):
        if self.weight_kg:
            return round(float(self.weight_kg) * 1.0)
        return None

    @property
    def per_meal_protein_g(self):
        if self.protein_target_g:
            return round(self.protein_target_g / 3)
        return None
