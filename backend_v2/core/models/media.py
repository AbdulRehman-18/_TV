from django.db import models
import uuid
from .scheduling import ScheduleMixin


class Media(ScheduleMixin, models.Model):
    MEDIA_TYPES = (
        ("image", "Image"),
        ("video", "Video"),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to="media_files/")
    file_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_fallback = models.BooleanField(
        default=False,
        help_text='Fallback content displays when no other content is scheduled.',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def file_url(self):
        if self.file:
            return self.file.url
        return None
