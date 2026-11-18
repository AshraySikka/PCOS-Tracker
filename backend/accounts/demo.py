"""Demo account helpers.

Jane is a shared, passwordless demo user. She is reached through the
demo-login endpoint only (her password is unusable, so the normal login form
can never open her account).
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from logs.models import DailyLog
from .demo_seed import SEED_DAYS, seed_demo_data

DEMO_EMAIL = 'jane.demo@example.com'
DEMO_USERNAME = 'Jane'

User = get_user_model()


def is_demo_user(user):
    return bool(user and getattr(user, 'email', None) == DEMO_EMAIL)


def demo_ai_blocked(user):
    """True when this request should not call the paid AI features."""
    return is_demo_user(user) and not getattr(settings, 'DEMO_ALLOW_AI', False)


DEMO_AI_MESSAGE = (
    'AI features are switched off in the demo account. '
    'Create a free account to try them.'
)


def ensure_demo_user(force=False):
    """Create Jane if needed and make sure her data runs up to today.

    Seed data is generated relative to today, so it goes stale as days pass.
    If today has no food logged for Jane (or force is True) her data is
    rebuilt, which keeps every date range on the dashboard populated.
    """
    user, created = User.objects.get_or_create(
        email=DEMO_EMAIL,
        defaults={'username': DEMO_USERNAME},
    )
    if created or user.has_usable_password():
        user.set_unusable_password()
        user.save(update_fields=['password'])

    today = timezone.now().date()
    fresh = DailyLog.objects.filter(
        user=user, date=today, food_entries__isnull=False
    ).exists()
    if force or not fresh:
        try:
            with transaction.atomic():
                seed_demo_data(user, today=today, days=SEED_DAYS)
        except IntegrityError:
            # Another request seeded at the same moment. Nothing to do.
            pass
    return user
