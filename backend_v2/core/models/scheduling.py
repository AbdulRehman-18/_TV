from django.db import models


class ScheduleMixin(models.Model):
    """
    Abstract mixin providing scheduling fields shared across
    Announcement, Event, and Media models.
    """

    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('emergency', 'Emergency'),
    ]

    RECURRENCE_CHOICES = [
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Date range
    schedule_start_date = models.DateField(null=True, blank=True)
    schedule_end_date = models.DateField(null=True, blank=True)

    # Daily time slot (HH:MM)
    schedule_time_start = models.TimeField(null=True, blank=True)
    schedule_time_end = models.TimeField(null=True, blank=True)

    # Recurrence
    recurrence_type = models.CharField(
        max_length=10,
        choices=RECURRENCE_CHOICES,
        default='none',
    )
    recurrence_days = models.JSONField(
        default=list,
        blank=True,
        help_text="List of day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday",
    )

    # Priority
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
    )

    # Duration in seconds
    duration = models.PositiveIntegerField(
        default=12,
        help_text="Duration to show this item in seconds (for non-video content)",
    )

    # Client / approval workflow
    client_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='approved',
    )
    admin_notes = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True
