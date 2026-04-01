from django.db import models
import uuid

class Media(models.Model):
    MEDIA_TYPES = (
        ("image", "Image"),
        ("video", "Video"),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to="media_files/")
    file_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

    @property
    def file_url(self):
        if self.file:
            return self.file.url
        return None
