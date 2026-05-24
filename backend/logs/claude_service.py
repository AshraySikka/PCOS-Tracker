import os
import json
import anthropic

def estimate_calories(food_name, quantity=''):
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    prompt = f"""You are a nutritionist. Estimate the calories and protein for this food item.

Food: {food_name}
Quantity: {quantity or 'standard serving'}

Respond ONLY with a valid JSON object, no other text:
{{
  "calories": 250,
  "protein_g": 12.5,
  "notes": "Based on standard serving size"
}}

Be realistic and accurate. If unsure, give a reasonable estimate."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )

    text = message.content[0].text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0]

    return json.loads(text)
