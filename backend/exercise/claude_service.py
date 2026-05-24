import os
import json
import anthropic

def generate_exercise_plan(profile):
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    symptoms = ', '.join(profile.symptoms) if profile.symptoms else 'none reported'

    prompt = f"""You are a certified fitness coach specialising in PCOS management. Create a personalised 7-day exercise plan.

PATIENT PROFILE:
- Age: {profile.age}
- Weight: {profile.weight_kg}kg
- Height: {profile.height_cm}cm
- BMI: {profile.bmi}
- Activity level: {profile.activity_level}
- PCOS symptoms: {symptoms}
- Goal: {profile.goal or 'manage PCOS symptoms and improve fitness'}

GUIDELINES:
- Focus on exercises that help with insulin resistance (strength training, HIIT, walking)
- Avoid over-exercising which can worsen cortisol and PCOS symptoms
- Include rest days
- Match intensity to activity level
- Include warm-up and cool-down suggestions
- Each exercise must have a clear YouTube search query

Respond ONLY with a valid JSON object, no other text:
{{
  "weekly_summary": "Brief overview of the plan",
  "days": [
    {{
      "day": "Monday",
      "type": "strength",
      "title": "Lower Body Strength",
      "duration_mins": 35,
      "intensity": "moderate",
      "exercises": [
        {{
          "name": "Bodyweight Squats",
          "sets": 3,
          "reps": "12-15",
          "duration_secs": null,
          "notes": "Keep knees aligned with toes",
          "youtube_query": "bodyweight squats for beginners PCOS"
        }}
      ]
    }}
  ]
}}

Generate all 7 days (Monday through Sunday). Include rest days as type "rest" with no exercises."""

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
