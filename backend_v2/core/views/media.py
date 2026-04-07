from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Media
from ..serializers import MediaSerializer,MediaStatsSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet


class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'priority', 'status', 'recurrence_type', 'file_type', 'is_fallback']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Media.objects.all().order_by('-created_at')
        return Media.objects.filter(
            is_active=True, status='approved'
        ).order_by('-created_at')

class MediaStatsViewSet(ReadOnlyModelViewSet):
    # queryset = Announcement.objects.all()
    serializer_class = MediaStatsSerializer

    def list(self, request, *args, **kwargs):
        count = Media.objects.filter(
            is_active=True,
            status='approved'
        ).count()

        serializer = self.get_serializer({'total_media': count})
        return Response(serializer.data)