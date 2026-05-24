import os
import django
from django.conf import settings

def pytest_configure(config):
    os.environ['DATABASE_URL'] = ''
    settings.DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
