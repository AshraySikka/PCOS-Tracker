from django.db import models
from django.conf import settings

class PushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions'
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.endpoint[:50]}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    meal_reminders = models.BooleanField(default=True)
    water_reminders = models.BooleanField(default=True)
    breakfast_time = models.TimeField(default='08:00')
    lunch_time = models.TimeField(default='13:00')
    dinner_time = models.TimeField(default='19:00')
    water_interval_hours = models.IntegerField(default=2)

    def __str__(self):
        return f"Prefs: {self.user.email}"
