import threading
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    AdminLoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)
from .tokens import email_verification_token, password_reset_token


# ─────────────────────────────────────────────
#  Helper: Generate JWT tokens for a user
# ─────────────────────────────────────────────
def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a given user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ─────────────────────────────────────────────
#  Helper: Send email utility
# ─────────────────────────────────────────────
def send_verification_email(user, request):
    """Send email verification link to the user."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verification_link = f"{frontend_url}/verify-email?uid={uid}&token={token}"

    subject = 'Verify Your Email Address — Signage System'
    message = (
        f"Hi {user.full_name},\n\n"
        f"Thank you for registering! Please verify your email address by clicking the link below:\n\n"
        f"{verification_link}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you didn't create an account, please ignore this email.\n\n"
        f"Best regards,\nSignage System Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Signage System</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Email Verification</p>
        </div>
        <div style="padding: 40px 30px;">
            <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Hi {user.full_name}! 👋</h2>
            <p style="color: #4a4a68; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                Thank you for registering. Please verify your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{verification_link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #8888a0; font-size: 13px; line-height: 1.6; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #eee;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{verification_link}" style="color: #667eea; word-break: break-all;">{verification_link}</a>
            </p>
        </div>
        <div style="background: #f8f9ff; padding: 20px 30px; text-align: center;">
            <p style="color: #8888a0; font-size: 12px; margin: 0;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
    </div>
    """

    email = EmailMultiAlternatives(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_message, "text/html")
    email.send(fail_silently=False)


def send_password_reset_email(user):
    """Send password reset link to the user."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = password_reset_token.make_token(user)

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

    subject = 'Reset Your Password — Signage System'
    message = (
        f"Hi {user.full_name},\n\n"
        f"We received a request to reset your password. Click the link below to set a new password:\n\n"
        f"{reset_link}\n\n"
        f"This link will expire in 1 hour.\n\n"
        f"If you didn't request a password reset, please ignore this email.\n\n"
        f"Best regards,\nSignage System Team"
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Signage System</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Password Reset</p>
        </div>
        <div style="padding: 40px 30px;">
            <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Hi {user.full_name}! 🔐</h2>
            <p style="color: #4a4a68; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                We received a request to reset your password. Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
                    Reset Password
                </a>
            </div>
            <p style="color: #8888a0; font-size: 13px; line-height: 1.6; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #eee;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{reset_link}" style="color: #f5576c; word-break: break-all;">{reset_link}</a>
            </p>
        </div>
        <div style="background: #fff5f7; padding: 20px 30px; text-align: center;">
            <p style="color: #8888a0; font-size: 12px; margin: 0;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
    </div>
    """

    email = EmailMultiAlternatives(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_message, "text/html")
    email.send(fail_silently=False)


# ═════════════════════════════════════════════════════
#  API VIEWS
# ═════════════════════════════════════════════════════


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST /api/register/
    Register a new user. Sends email verification link.
    """
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        def send_verification():
            try:
                send_verification_email(user, request)
            except Exception as e:
                print(f"[EMAIL ERROR] Failed to send verification email: {e}")

        threading.Thread(target=send_verification, daemon=True).start()

        return Response({
            'success': True,
            'message': 'Registration successful! Please check your email to verify your account.',
            'data': {
                'email': user.email,
                'full_name': user.full_name,
            }
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': 'Registration failed. Please fix the errors below.',
        'errors': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email_view(request):
    """
    GET /api/verify-email/?uid=<uid>&token=<token>
    Verify user's email address using the token from the email link.
    """
    uid = request.GET.get('uid')
    token = request.GET.get('token')

    if not uid or not token:
        return Response({
            'success': False,
            'message': 'Missing uid or token parameter.',
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'success': False,
            'message': 'Invalid verification link.',
        }, status=status.HTTP_400_BAD_REQUEST)

    if user.is_verified:
        return Response({
            'success': True,
            'message': 'Email is already verified. You can log in.',
        }, status=status.HTTP_200_OK)

    if email_verification_token.check_token(user, token):
        user.is_verified = True
        user.save()
        return Response({
            'success': True,
            'message': 'Email verified successfully! You can now log in.',
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Invalid or expired verification link.',
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/login/
    Authenticate user and return JWT tokens.
    Only allows login if is_verified=True.
    """
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        return Response({
            'success': True,
            'message': 'Login successful!',
            'data': {
                'tokens': tokens,
                'user': UserSerializer(user).data,
            }
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Login failed.',
        'errors': serializer.errors,
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_view(request):
    """
    POST /api/admin-login/
    Authenticate admin user and return JWT tokens.
    Only allows login if is_admin=True and is_verified=True.
    """
    serializer = AdminLoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        return Response({
            'success': True,
            'message': 'Admin login successful!',
            'data': {
                'tokens': tokens,
                'user': UserSerializer(user).data,
            }
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Admin login failed.',
        'errors': serializer.errors,
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """
    POST /api/forgot-password/
    Send password reset link to the user's email.
    """
    serializer = ForgotPasswordSerializer(data=request.data)

    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)

        def send_email():
            try:
                send_password_reset_email(user)
            except Exception as e:
                print(f"[EMAIL ERROR] Failed to send password reset email: {e}")

        threading.Thread(target=send_email, daemon=True).start()

        return Response({
            'success': True,
            'message': 'Password reset link has been sent to your email.',
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Request failed.',
        'errors': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    POST /api/reset-password/
    Reset user's password using the token from the email link.
    Expects: uid, token, password, confirm_password
    """
    uid = request.data.get('uid')
    token = request.data.get('token')

    if not uid or not token:
        return Response({
            'success': False,
            'message': 'Missing uid or token.',
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'success': False,
            'message': 'Invalid password reset link.',
        }, status=status.HTTP_400_BAD_REQUEST)

    if not password_reset_token.check_token(user, token):
        return Response({
            'success': False,
            'message': 'Invalid or expired password reset link.',
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = ResetPasswordSerializer(data=request.data)

    if serializer.is_valid():
        user.set_password(serializer.validated_data['password'])
        user.save()

        return Response({
            'success': True,
            'message': 'Password reset successfully! You can now log in with your new password.',
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Password reset failed.',
        'errors': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


# ═════════════════════════════════════════════════════
#  TOKEN REFRESH VIEW
# ═════════════════════════════════════════════════════


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/token/refresh/
    Custom token refresh view that returns tokens in the same format as login.
    """
    def post(self, request, *args, **kwargs):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh = serializer.validated_data['refresh']
        refresh_token = RefreshToken(refresh)

        return Response({
            'success': True,
            'message': 'Token refreshed successfully!',
            'data': {
                'tokens': {
                    'access': str(refresh_token.access_token),
                    'refresh': str(refresh_token),
                }
            }
        }, status=status.HTTP_200_OK)


# ═════════════════════════════════════════════════════
#  CURRENT USER ENDPOINTS
# ═════════════════════════════════════════════════════


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def current_user_view(request):
    """
    GET /api/auth/me/ - Get current authenticated user details
    PATCH /api/auth/me/ - Update current authenticated user details
    """
    if not request.user or not request.user.is_authenticated:
        if request.method == 'GET':
            return Response({
                'success': True,
                'data': None,
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Authentication required.',
            }, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response({
            'success': True,
            'data': UserSerializer(request.user).data,
        }, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        # Only allow updating certain fields
        allowed_fields = ['full_name']
        update_data = {}

        for field in allowed_fields:
            if field in request.data:
                update_data[field] = request.data[field]

        if not update_data:
            return Response({
                'success': False,
                'message': 'No valid fields to update.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update the user
        for field, value in update_data.items():
            setattr(request.user, field, value)

        request.user.save()

        return Response({
            'success': True,
            'message': 'Profile updated successfully!',
            'data': UserSerializer(request.user).data,
        }, status=status.HTTP_200_OK)


# ═════════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ═════════════════════════════════════════════════════


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_clients_view(request):
    """
    GET /api/auth/admin/clients/
    Get all non-admin users (clients) for admin dashboard.
    Only accessible by admin users.
    """
    # Get all non-admin users, ordered by most recent
    clients = User.objects.filter(is_admin=False).order_by('-date_joined')

    return Response({
        'success': True,
        'data': UserSerializer(clients, many=True).data,
    }, status=status.HTTP_200_OK)
