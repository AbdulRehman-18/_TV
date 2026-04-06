import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for user registration.
    Validates email (Gmail only), password match, and full_name.
    """
    full_name = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            'required': 'Full name is required.',
            'blank': 'Full name cannot be blank.',
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required.',
            'blank': 'Email cannot be blank.',
        }
    )
    password = serializers.CharField(
        min_length=8,
        write_only=True,
        required=True,
        error_messages={
            'required': 'Password is required.',
            'blank': 'Password cannot be blank.',
            'min_length': 'Password must be at least 8 characters long.',
        }
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            'required': 'Confirm password is required.',
            'blank': 'Confirm password cannot be blank.',
        }
    )

    def validate_email(self, value):
        """Validate that email is a Gmail address and is not already registered."""
        email = value.lower().strip()

        # Strict Gmail pattern validation
        gmail_pattern = r'^[a-zA-Z0-9._%+-]+@gmail\.com$'
        if not re.match(gmail_pattern, email):
            raise serializers.ValidationError(
                'Only Gmail addresses are allowed (example@gmail.com).'
            )

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                'A user with this email already exists.'
            )

        return email

    def validate(self, attrs):
        """Validate that password and confirm_password match."""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })

        return attrs

    def create(self, validated_data):
        """Create a new user with validated data."""
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Validates credentials and checks email verification status.
    """
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required.',
            'blank': 'Email cannot be blank.',
        }
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        error_messages={
            'required': 'Password is required.',
            'blank': 'Password cannot be blank.',
        }
    )

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')

        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'No account found with this email address.'
            })

        # Check if email is verified
        if not user.is_verified:
            raise serializers.ValidationError({
                'email': 'Please verify your email address before logging in.'
            })

        # Authenticate
        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError({
                'password': 'Invalid password.'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'email': 'This account has been deactivated.'
            })

        attrs['user'] = user
        return attrs


class AdminLoginSerializer(serializers.Serializer):
    """
    Serializer for admin login.
    Only allows login if user exists, is_verified=True, and is_admin=True.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'No admin account found with this email.'
            })

        if not user.is_admin:
            raise serializers.ValidationError({
                'email': 'You do not have admin privileges.'
            })

        if not user.is_verified:
            raise serializers.ValidationError({
                'email': 'Please verify your email address first.'
            })

        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError({
                'password': 'Invalid password.'
            })

        attrs['user'] = user
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password - accepts email."""
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required.',
            'blank': 'Email cannot be blank.',
        }
    )

    def validate_email(self, value):
        email = value.lower().strip()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                'No account found with this email address.'
            )
        return email


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password with token."""
    password = serializers.CharField(
        min_length=8,
        write_only=True,
        required=True,
        error_messages={
            'required': 'New password is required.',
            'min_length': 'Password must be at least 8 characters long.',
        }
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            'required': 'Confirm password is required.',
        }
    )

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })

        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Serializer for returning user data in responses."""

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'is_verified', 'is_admin', 'date_joined']
        read_only_fields = fields
