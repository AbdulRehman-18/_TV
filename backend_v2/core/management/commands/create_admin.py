import os
from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Create the initial admin superuser if it does not exist.'

    def handle(self, *args, **options):
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@tvdisplay.local')
        full_name = os.environ.get('DJANGO_SUPERUSER_FULL_NAME', 'Admin User')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        if not password:
            self.stderr.write(self.style.ERROR(
                'DJANGO_SUPERUSER_PASSWORD environment variable is not set. '
                'Admin user will not be created.'
            ))
            raise SystemExit(1)

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Admin user "{email}" already exists.'))
            return

        User.objects.create_superuser(
            email=email,
            full_name=full_name,
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f'Admin user "{email}" created successfully.'))
