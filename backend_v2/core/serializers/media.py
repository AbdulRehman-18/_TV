from rest_framework import serializers
from ..models import Media

SCHEDULE_FIELDS = [
    'schedule_start_date', 'schedule_end_date',
    'schedule_time_start', 'schedule_time_end',
    'recurrence_type', 'recurrence_days',
    'priority', 'client_id', 'status', 'admin_notes',
]


class MediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = [
            'id', 'title', 'description', 'file', 'file_url',
            'file_type', 'file_name', 'file_size',
            'created_at', 'is_active', 'is_fallback',
        ] + SCHEDULE_FIELDS
        read_only_fields = ['id', 'created_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
