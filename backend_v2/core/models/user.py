from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """Custom user model supporting admin and client roles."""

    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('client', 'Client'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    organization = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    is_approved = models.BooleanField(
        default=False,
        help_text='Clients must be approved by an admin before they can submit content.',
    )

    class Meta:
        db_table = 'auth_user'

    def __str__(self):
        return f'{self.username} ({self.role})'

    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser

    @property
    def is_client(self):
        return self.role == 'client'
