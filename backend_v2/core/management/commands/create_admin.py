import os
from django.core.management.base import BaseCommand
from core.models import User


class Command(BaseCommand):
    help = 'Create the initial admin superuser if it does not exist.'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@tvdisplay.local')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'Admin user "{username}" already exists.'))
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role='admin',
            is_approved=True,
        )
        self.stdout.write(self.style.SUCCESS(f'Admin user "{username}" created successfully.'))
