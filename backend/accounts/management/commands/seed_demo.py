from django.core.management.base import BaseCommand

from accounts.demo import DEMO_EMAIL, ensure_demo_user
from logs.models import DailyLog


class Command(BaseCommand):
    help = (
        'Create or refresh the demo user Jane and her seed data '
        '(about five months of logs ending today). Safe to run again.'
    )

    def handle(self, *args, **options):
        user = ensure_demo_user(force=True)
        count = DailyLog.objects.filter(user=user).count()
        self.stdout.write(self.style.SUCCESS(
            f'Seeded {DEMO_EMAIL} with {count} logged days.'
        ))
