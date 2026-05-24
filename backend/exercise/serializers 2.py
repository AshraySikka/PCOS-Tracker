from rest_framework import serializers
from .models import ExercisePlan, ExerciseDay, Exercise

class ExerciseSerializer(serializers.ModelSerializer):
    youtube_url = serializers.ReadOnlyField()

    class Meta:
        model = Exercise
        fields = ['id', 'name', 'sets', 'reps', 'duration_secs', 'notes', 'youtube_url']

class ExerciseDaySerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = ExerciseDay
        fields = ['id', 'day', 'type', 'title', 'duration_mins', 'intensity', 'exercises']

class ExercisePlanSerializer(serializers.ModelSerializer):
    days = ExerciseDaySerializer(many=True, read_only=True)

    class Meta:
        model = ExercisePlan
        fields = ['id', 'weekly_summary', 'created_at', 'days']
