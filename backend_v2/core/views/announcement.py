from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Announcement
from ..serializers import AnnouncementSerializer,AnnouncementStatsSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'priority', 'status', 'recurrence_type']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Announcement.objects.all().order_by('-created_at')
        return Announcement.objects.filter(
            is_active=True, status='approved'
        ).order_by('-created_at')
    
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