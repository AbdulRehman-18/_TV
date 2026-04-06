from django.core.management.base import BaseCommand
from core.models import User


class Command(BaseCommand):
    help = 'Create the requested admin accounts: admin1 and admin2.'

    def handle(self, *args, **options):
        admins = [
            {'username': 'admin1', 'password': 'admin1', 'email': 'admin1@tvdisplay.local'},
            {'username': 'admin2', 'password': 'admin2', 'email': 'admin2@tvdisplay.local'},
        ]

        for admin_data in admins:
            username = admin_data['username']
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
                user.set_password(admin_data['password'])
                user.role = 'admin'
                user.is_staff = True
                user.is_superuser = True
                user.is_approved = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Updated existing user "{username}" password and roles.'))
            else:
                User.objects.create_superuser(
                    username=username,
                    email=admin_data['email'],
                    password=admin_data['password'],
                    role='admin',
                    is_approved=True,
                )
                self.stdout.write(self.style.SUCCESS(f'Created admin user "{username}" successfully.'))

        # Ensure any other users are treated as clients
        # (Actually the User model default is already 'client')
        self.stdout.write(self.style.SUCCESS('Seeding complete. admin1 and admin2 are ready.'))
