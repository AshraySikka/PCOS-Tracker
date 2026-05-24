import os
import uuid
from supabase import create_client

def get_supabase_client():
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    return create_client(url, key)

def upload_avatar(file, user_id):
    supabase = get_supabase_client()
    ext = file.name.split('.')[-1].lower()
    if ext not in ['jpg', 'jpeg', 'png', 'webp']:
        raise ValueError('Invalid file type. Use jpg, png, or webp.')
    filename = f"avatars/{user_id}/{uuid.uuid4()}.{ext}"
    file_bytes = file.read()
    supabase.storage.from_('avatars').upload(
        filename,
        file_bytes,
        {'content-type': file.content_type}
    )
    public_url = supabase.storage.from_('avatars').get_public_url(filename)
    return public_url
