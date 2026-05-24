from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    bmi = serializers.ReadOnlyField()
    protein_target_g = serializers.ReadOnlyField()
    per_meal_protein_g = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'age', 'weight_kg', 'height_cm', 'activity_level',
            'symptoms', 'cuisine_preferences', 'food_items', 'goal',
            'avatar_url', 'bmi', 'protein_target_g', 'per_meal_protein_g',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
