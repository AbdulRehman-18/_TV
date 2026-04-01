from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from ..models import Event
from ..serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Public users only see active events
        if self.request.user.is_authenticated:
            return Event.objects.all().order_by("start_date")
        return Event.objects.filter(is_active=True).order_by("start_date")
