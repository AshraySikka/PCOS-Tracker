import os
import json
import anthropic

def generate_meal_plan(profile):
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    symptoms = ', '.join(profile.symptoms) if profile.symptoms else 'none reported'
    cuisines = ', '.join(profile.cuisine_preferences) if profile.cuisine_preferences else 'any'
    food_items = profile.food_items or 'no specific preferences'

    prompt = f"""You are a certified nutritionist specialising in PCOS management. Create a personalised 7-day meal plan.

PATIENT PROFILE:
- Age: {profile.age}
- Weight: {profile.weight_kg}kg
- Height: {profile.height_cm}cm
- BMI: {profile.bmi}
- Activity level: {profile.activity_level}
- Daily protein target: {profile.protein_target_g}g
- Per meal protein target: {profile.per_meal_protein_g}g
- PCOS symptoms: {symptoms}
- Cuisine preferences: {cuisines}
- Foods they eat: {food_items}
- Goal: {profile.goal or 'manage PCOS symptoms'}

GUIDELINES:
- Focus on low glycemic index foods to manage insulin resistance
- Each meal must hit the per-meal protein target of {profile.per_meal_protein_g}g
- Avoid processed foods, refined sugars, and refined carbs
- Include anti-inflammatory foods
- Base meals around their cuisine preferences and food items where possible
- Do NOT suggest any medical treatments or supplements

Respond ONLY with a valid JSON object in this exact format, no other text:
{{
  "week_start": "Monday",
  "daily_protein_target": {profile.protein_target_g},
  "per_meal_protein": {profile.per_meal_protein_g},
  "days": [
    {{
      "day": "Monday",
      "meals": [
        {{
          "type": "breakfast",
          "name": "Meal name",
          "description": "Brief description",
          "protein_g": 25,
          "calories": 350,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "image_query": "food photo search term"
        }},
        {{
          "type": "lunch",
          "name": "Meal name",
          "description": "Brief description",
          "protein_g": 30,
          "calories": 450,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "image_query": "food photo search term"
        }},
        {{
          "type": "dinner",
          "name": "Meal name",
          "description": "Brief description",
          "protein_g": 35,
          "calories": 500,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "image_query": "food photo search term"
        }}
      ]
    }}
  ]
}}

Generate exactly 3 days only (Monday, Tuesday, Wednesday). Return only 3 days in the array."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=6000,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text
    clean = response_text.strip()
    if clean.startswith('```'):
        clean = clean.split('\n', 1)[1]
        clean = clean.rsplit('```', 1)[0]

    return json.loads(clean)
