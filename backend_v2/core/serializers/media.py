from rest_framework import serializers
from ..models import Media

class MediaSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source='file', read_only=True)

    class Meta:
        model = Media
        fields = [
            "id", "title", "description", "file", "file_url", 
            "file_type", "file_name", "file_size", 
            "created_at", "is_active"
        ]
        read_only_fields = ["id", "created_at"]
