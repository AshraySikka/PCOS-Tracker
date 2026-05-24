import pytest

def test_true():
    assert True

@pytest.mark.django_db
def test_database_accessible():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    assert User.objects.count() == 0
