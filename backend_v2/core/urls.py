from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet, EventViewSet, MediaViewSet

router = DefaultRouter()
router.register(r"announcements", AnnouncementViewSet)
router.register(r"events", EventViewSet)
router.register(r"media", MediaViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
