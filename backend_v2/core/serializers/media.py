from rest_framework import serializers
from ..models import Media

ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/webm', 'video/quicktime'],
}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

SCHEDULE_FIELDS = [
    'schedule_start_date', 'schedule_end_date',
    'schedule_time_start', 'schedule_time_end',
    'recurrence_type', 'recurrence_days',
    'priority', 'duration', 'client', 'status', 'admin_notes',
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

    def validate_file(self, file):
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f'File size must not exceed {MAX_FILE_SIZE // (1024 * 1024)} MB.'
            )
        content_type = getattr(file, 'content_type', '')
        allowed = ALLOWED_MIME_TYPES['image'] + ALLOWED_MIME_TYPES['video']
        if content_type not in allowed:
            raise serializers.ValidationError(
                'Invalid file type. Only JPEG, PNG, GIF, WebP images and MP4, WebM, MOV videos are allowed.'
            )
        return file


class MediaStatsSerializer(serializers.Serializer):
    total_media = serializers.IntegerField()
