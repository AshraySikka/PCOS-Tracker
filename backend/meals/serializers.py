from rest_framework import serializers
from .models import MealPlan, MealDay, Meal

class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = ['id', 'meal_type', 'name', 'description', 'protein_g',
                  'calories', 'ingredients', 'image_url']

class MealDaySerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)

    class Meta:
        model = MealDay
        fields = ['id', 'day', 'meals']

class MealPlanSerializer(serializers.ModelSerializer):
    days = MealDaySerializer(many=True, read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'week_start', 'daily_protein_target',
                  'per_meal_protein', 'created_at', 'days']
