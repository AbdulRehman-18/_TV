from io import BytesIO
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers
from ..models import Media

ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/webm', 'video/quicktime'],
}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

# Video magic bytes: (signature_bytes, byte_offset)
_VIDEO_SIGNATURES = [
    (b'\x00\x00\x00\x18ftyp', 0),   # MP4 / MOV (most common)
    (b'\x00\x00\x00\x1cftyp', 0),   # MP4 variant
    (b'\x1aE\xdf\xa3', 0),          # WebM / MKV
    (b'ftyp', 4),                   # MP4 / MOV (offset 4)
    (b'moov', 4),                   # QuickTime
    (b'free', 4),                   # QuickTime
    (b'mdat', 4),                   # QuickTime
]

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

        header = file.read(32)
        file.seek(0)

        # Try to verify as image using Pillow (reads actual pixel data header)
        try:
            img = Image.open(BytesIO(header + file.read(1024)))
            file.seek(0)
            img_format = (img.format or '').lower()
            format_to_mime = {'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp'}
            if img_format in format_to_mime:
                return file
        except (UnidentifiedImageError, Exception):
            file.seek(0)

        # Try to verify as video using magic bytes
        for signature, offset in _VIDEO_SIGNATURES:
            if header[offset:offset + len(signature)] == signature:
                return file

        raise serializers.ValidationError(
            'Invalid file. Only JPEG, PNG, GIF, WebP images and MP4, WebM, MOV videos are allowed.'
        )


class MediaStatsSerializer(serializers.Serializer):
    total_media = serializers.IntegerField()
