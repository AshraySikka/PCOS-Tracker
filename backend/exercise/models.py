from django.db import models
from django.conf import settings

class ExercisePlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exercise_plans'
    )
    weekly_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class ExerciseDay(models.Model):
    DAY_TYPES = [
        ('strength', 'Strength'),
        ('cardio', 'Cardio'),
        ('hiit', 'HIIT'),
        ('yoga', 'Yoga'),
        ('walk', 'Walk'),
        ('rest', 'Rest'),
        ('mixed', 'Mixed'),
    ]
    plan = models.ForeignKey(ExercisePlan, on_delete=models.CASCADE, related_name='days')
    day = models.CharField(max_length=10)
    type = models.CharField(max_length=20, choices=DAY_TYPES, default='mixed')
    title = models.CharField(max_length=200)
    duration_mins = models.IntegerField(default=0)
    intensity = models.CharField(max_length=20, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class Exercise(models.Model):
    day = models.ForeignKey(ExerciseDay, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=200)
    sets = models.IntegerField(null=True, blank=True)
    reps = models.CharField(max_length=50, blank=True, null=True, default='')
    duration_secs = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    youtube_query = models.CharField(max_length=300, blank=True)

    @property
    def youtube_url(self):
        if self.youtube_query:
            import urllib.parse
            query = urllib.parse.quote_plus(self.youtube_query)
            return f"https://www.youtube.com/results?search_query={query}"
        return ''
