from rest_framework import serializers
from ..models import Announcement

SCHEDULE_FIELDS = [
    'schedule_start_date', 'schedule_end_date',
    'schedule_time_start', 'schedule_time_end',
    'recurrence_type', 'recurrence_days',
    'priority', 'duration', 'client_id', 'status', 'admin_notes',
]


class AnnouncementSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'body', 'image', 'image_url',
            'created_at', 'is_active',
        ] + SCHEDULE_FIELDS
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
