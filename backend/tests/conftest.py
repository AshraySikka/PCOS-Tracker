import django
from django.test import override_settings

def pytest_configure(config):
    from django.conf import settings
    if not settings.configured:
        return
    settings.DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
