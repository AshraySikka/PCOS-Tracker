import pytest

def test_true():
    assert True

@pytest.mark.django_db
def test_database_accessible():
    from django.contrib.auth.models import User
    assert User.objects.count() == 0
