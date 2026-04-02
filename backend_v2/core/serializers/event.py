from rest_framework import serializers
from ..models import Event

class EventSerializer(serializers.ModelSerializer):
    image_url = serializers.ImageField(source='image', read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "title", "description", "location", 
            "start_date", "end_date", "image", "image_url", 
            "created_at", "is_active"
        ]
        read_only_fields = ["id", "created_at"]
