from rest_framework.response import Response
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Announcement
from ..serializers import AnnouncementSerializer,AnnouncementStatsSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet
from .content_workflow import ContentWorkflowMixin, ContentWorkflowPermission


class AnnouncementViewSet(ContentWorkflowMixin, viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [ContentWorkflowPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'priority', 'status', 'recurrence_type']
    
class AnnouncementStatsViewSet(ReadOnlyModelViewSet):
    # queryset = Announcement.objects.all()
    serializer_class = AnnouncementStatsSerializer

    def list(self, request, *args, **kwargs):
        count = Announcement.objects.filter(
            is_active=True,
            status='approved'
        ).count()

        serializer = self.get_serializer({'total_announcements': count})
        return Response(serializer.data)
