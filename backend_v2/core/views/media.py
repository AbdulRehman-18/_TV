from rest_framework import viewsets
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Media
from ..serializers import MediaSerializer, MediaStatsSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet
from .content_workflow import ContentWorkflowMixin, ContentWorkflowPermission


class MediaViewSet(ContentWorkflowMixin, viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    permission_classes = [ContentWorkflowPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'priority', 'status', 'recurrence_type', 'file_type', 'is_fallback']

class MediaStatsViewSet(ReadOnlyModelViewSet):
    queryset = Media.objects.none()
    serializer_class = MediaStatsSerializer

    def list(self, request, *args, **kwargs):
        count = Media.objects.filter(
            is_active=True,
            status='approved'
        ).count()

        serializer = self.get_serializer({'total_media': count})
        return Response(serializer.data)
