from rest_framework import serializers
from ..models import Announcement

class AnnouncementSerializer(serializers.ModelSerializer):
    image_url = serializers.ImageField(source='image', read_only=True)

    class Meta:
        model = Announcement
        fields = ["id", "title", "body", "image", "image_url", "created_at", "is_active"]
        read_only_fields = ["id", "created_at"]
