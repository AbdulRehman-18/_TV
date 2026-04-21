from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Event
from ..serializers import EventSerializer,EventStatsSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet
from .content_workflow import ContentWorkflowMixin, ContentWorkflowPermission


class EventViewSet(ContentWorkflowMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [ContentWorkflowPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'priority', 'status', 'recurrence_type']
    ordering = 'start_date'


class EventStatsViewSet(ReadOnlyModelViewSet):
    # queryset = Announcement.objects.all()
    serializer_class = EventStatsSerializer

    def list(self, request, *args, **kwargs):
        count = Event.objects.filter(
            is_active=True,
            status='approved'
        ).count()

        serializer = self.get_serializer({'total_events': count})
        return Response(serializer.data)
