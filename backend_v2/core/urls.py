from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet, EventViewSet, MediaViewSet,
    ActiveScheduleView, AnnouncementStatsViewSet, EventStatsViewSet, MediaStatsViewSet
)

router = DefaultRouter()
router.register(r"announcements", AnnouncementViewSet,basename="announcement")
router.register(r"events", EventViewSet,basename="event")
router.register(r"media", MediaViewSet,basename="media")
router.register(r"announcement-stats",AnnouncementStatsViewSet,basename="announcement-stats")
router.register(r"event-stats",EventStatsViewSet,basename="event-stats")
router.register(r"media-stats",MediaStatsViewSet,basename="media-stats")

urlpatterns = [
    # Content CRUD
    path("", include(router.urls)),

    # Schedule
    path("schedule/active/", ActiveScheduleView.as_view(), name="active_schedule"),
]
