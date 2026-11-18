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


import pytest


@pytest.fixture(autouse=True)
def _no_demo_photo_fetch(settings):
    # Never hit the photo service from tests.
    settings.DEMO_FETCH_IMAGES = False
