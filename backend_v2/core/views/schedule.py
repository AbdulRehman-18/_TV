from datetime import date, datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..models import Announcement, Event, Media
from ..serializers import AnnouncementSerializer, EventSerializer, MediaSerializer


class ActiveScheduleView(APIView):
    """
    Returns all content currently active based on:
    - is_active = True and status = 'approved'
    - schedule_start_date <= today <= schedule_end_date (or no date constraint)
    - schedule_time_start <= now <= schedule_time_end (or no time constraint)
    - recurrence day matches (or recurrence = 'none')
    """
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_time = now.time()
        current_weekday_js = (now.weekday() + 1) % 7  # Convert Python (Mon=0) to JS (Sun=0)

        announcements = self._filter_active(
            Announcement.objects.filter(is_active=True, status='approved'),
            today, current_time, current_weekday_js,
        )
        events = self._filter_active(
            Event.objects.filter(is_active=True, status='approved'),
            today, current_time, current_weekday_js,
        )
        # Regular media (not fallback)
        media = self._filter_active(
            Media.objects.filter(is_active=True, status='approved', is_fallback=False),
            today, current_time, current_weekday_js,
        )
        # Fallback media — used when no other content is active
        fallback_media = Media.objects.filter(
            is_active=True, status='approved', is_fallback=True,
        )

        return Response({
            'announcements': AnnouncementSerializer(
                announcements, many=True, context={'request': request}
            ).data,
            'events': EventSerializer(
                events, many=True, context={'request': request}
            ).data,
            'media': MediaSerializer(
                media, many=True, context={'request': request}
            ).data,
            'fallback_media': MediaSerializer(
                fallback_media, many=True, context={'request': request}
            ).data,
            'timestamp': now.isoformat(),
        })

    def _filter_active(self, qs, today, current_time, current_weekday_js):
        """Filter a queryset to only include items active right now."""
        result = []
        for item in qs:
            # Date range check
            if item.schedule_start_date and item.schedule_start_date > today:
                continue
            if item.schedule_end_date and item.schedule_end_date < today:
                continue

            # Time window check
            if item.schedule_time_start and item.schedule_time_end:
                if not (item.schedule_time_start <= current_time <= item.schedule_time_end):
                    continue

            # Recurrence check
            if item.recurrence_type == 'weekly' and item.recurrence_days:
                if current_weekday_js not in item.recurrence_days:
                    continue

            result.append(item)

        # Sort by priority: emergency > high > normal
        priority_order = {'emergency': 0, 'high': 1, 'normal': 2}
        result.sort(key=lambda x: priority_order.get(x.priority, 2))
        return result
