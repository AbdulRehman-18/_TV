from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Event
from ..serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'priority', 'status', 'recurrence_type']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Event.objects.all().order_by('start_date')
        return Event.objects.filter(
            is_active=True, status='approved'
        ).order_by('start_date')
