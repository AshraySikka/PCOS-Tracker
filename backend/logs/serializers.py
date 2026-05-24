from rest_framework import serializers
from .models import DailyLog, FoodEntry, ExerciseEntry, WaterEntry

class FoodEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodEntry
        fields = ['id', 'meal_type', 'name', 'quantity', 'calories',
                  'protein_g', 'is_estimated', 'created_at']
        read_only_fields = ['id', 'created_at']

class ExerciseEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseEntry
        fields = ['id', 'name', 'duration_mins', 'calories_burned', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

class WaterEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterEntry
        fields = ['id', 'amount_ml', 'created_at']
        read_only_fields = ['id', 'created_at']

class DailyLogSerializer(serializers.ModelSerializer):
    food_entries = FoodEntrySerializer(many=True, read_only=True)
    exercise_entries = ExerciseEntrySerializer(many=True, read_only=True)
    water_entries = WaterEntrySerializer(many=True, read_only=True)
    total_calories = serializers.ReadOnlyField()
    total_protein = serializers.ReadOnlyField()
    total_water_ml = serializers.ReadOnlyField()
    total_exercise_mins = serializers.ReadOnlyField()
    total_calories_burned = serializers.ReadOnlyField()

    class Meta:
        model = DailyLog
        fields = [
            'id', 'date', 'food_entries', 'exercise_entries', 'water_entries',
            'total_calories', 'total_protein', 'total_water_ml',
            'total_exercise_mins', 'total_calories_burned', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
