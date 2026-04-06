from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from .managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with email as the unique identifier.
    No username field — authentication is done via email + password.
    """
    email = models.EmailField(
        verbose_name='Email Address',
        max_length=255,
        unique=True,
        db_index=True,
    )
    full_name = models.CharField(
        verbose_name='Full Name',
        max_length=255,
    )
    is_verified = models.BooleanField(
        default=False,
        help_text='Designates whether this user has verified their email address.',
    )
    is_admin = models.BooleanField(
        default=False,
        help_text='Designates whether this user has admin access.',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Designates whether this user account is active.',
    )
    is_staff = models.BooleanField(
        default=False,
        help_text='Designates whether the user can log into the Django admin site.',
    )
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.full_name.split(' ')[0] if self.full_name else self.email
