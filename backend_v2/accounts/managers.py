from django.contrib.auth.models import BaseUserManager
from django.conf import settings

class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier
    for authentication instead of username.
    """

    def create_user(self, email, full_name, password=None, **extra_fields):
        """
        Create and save a regular user with the given email, full_name, and password.
        """
        if not email:
            raise ValueError('The Email field is required.')
        if not full_name:
            raise ValueError('The Full Name field is required.')

        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        if email.lower() != settings.ADMIN_EMAIL:
            raise ValueError("Superuser email must match ADMIN_EMAIL")

        if self.model.objects.filter(is_admin=True).exists():
            raise ValueError("Only one admin is allowed.")

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_verified', True)

        return self.create_user(email, full_name, password, **extra_fields)