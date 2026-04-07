from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Create the requested admin accounts: admin1 and admin2.'

    def handle(self, *args, **options):
        admins = [
            {
                'email': 'admin1@tvdisplay.local',
                'full_name': 'Admin One',
                'password': 'admin1',
            },
            {
                'email': 'admin2@tvdisplay.local',
                'full_name': 'Admin Two',
                'password': 'admin2',
            },
        ]

        for admin_data in admins:
            email = admin_data['email']
            if User.objects.filter(email=email).exists():
                user = User.objects.get(email=email)
                user.set_password(admin_data['password'])
                user.is_staff = True
                user.is_superuser = True
                user.is_admin = True
                user.is_verified = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Updated existing user "{email}" password and roles.'))
            else:
                User.objects.create_superuser(
                    email=email,
                    full_name=admin_data['full_name'],
                    password=admin_data['password'],
                )
                self.stdout.write(self.style.SUCCESS(f'Created admin user "{email}" successfully.'))

        self.stdout.write(self.style.SUCCESS('Seeding complete. admin1 and admin2 are ready.'))
