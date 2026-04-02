from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from ..models import Announcement
from ..serializers import AnnouncementSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Public users only see active announcements
        if self.request.user.is_authenticated:
            return Announcement.objects.all().order_by("-created_at")
        return Announcement.objects.filter(is_active=True).order_by("-created_at")
