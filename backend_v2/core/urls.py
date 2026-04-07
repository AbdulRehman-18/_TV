from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet, EventViewSet, MediaViewSet,
    ActiveScheduleView,
)

router = DefaultRouter()
router.register(r"announcements", AnnouncementViewSet)
router.register(r"events", EventViewSet)
router.register(r"media", MediaViewSet)

urlpatterns = [
    # Content CRUD
    path("", include(router.urls)),

    # Schedule
    path("schedule/active/", ActiveScheduleView.as_view(), name="active_schedule"),
]
