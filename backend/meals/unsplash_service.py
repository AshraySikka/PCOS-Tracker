import os
import requests

def fetch_food_image(query):
    access_key = os.getenv('UNSPLASH_ACCESS_KEY')
    if not access_key:
        return ''
    try:
        res = requests.get(
            'https://api.unsplash.com/search/photos',
            params={'query': query, 'per_page': 1, 'orientation': 'landscape'},
            headers={'Authorization': f'Client-ID {access_key}'},
            timeout=5
        )
        data = res.json()
        if data.get('results'):
            return data['results'][0]['urls']['regular']
    except Exception:
        pass
    return ''
