from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AnnouncementViewSet, EventViewSet, MediaViewSet,
    RegisterView, LoginView, MeView,
    ClientListView, ClientApprovalView,
    ActiveScheduleView,
)

router = DefaultRouter()
router.register(r"announcements", AnnouncementViewSet)
router.register(r"events", EventViewSet)
router.register(r"media", MediaViewSet)

urlpatterns = [
    # Content CRUD
    path("", include(router.urls)),

    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),

    # Admin: client management
    path("admin/clients/", ClientListView.as_view(), name="client_list"),
    path("admin/clients/<uuid:pk>/approve/", ClientApprovalView.as_view(), name="client_approve"),

    # Schedule
    path("schedule/active/", ActiveScheduleView.as_view(), name="active_schedule"),
]
