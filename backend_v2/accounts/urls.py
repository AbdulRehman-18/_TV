from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('verify-email/', views.verify_email_view, name='verify-email'),
    path('login/', views.login_view, name='login'),
    path('admin-login/', views.admin_login_view, name='admin-login'),
    path('forgot-password/', views.forgot_password_view, name='forgot-password'),
    path('reset-password/', views.reset_password_view, name='reset-password'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token-refresh'),
    path('me/', views.current_user_view, name='current-user'),
    path('admin/clients/', views.admin_clients_view, name='admin-clients'),
]
