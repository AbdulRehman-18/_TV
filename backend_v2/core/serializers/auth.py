from rest_framework import serializers
from django.contrib.auth import authenticate
from ..models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'organization',
            'phone', 'is_approved', 'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'role', 'organization', 'phone',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})

        # Clients require approval; admins can only be created by superusers
        role = data.get('role', 'client')
        request = self.context.get('request')
        if role == 'admin':
            if not request or not request.user.is_authenticated or not request.user.is_superuser:
                raise serializers.ValidationError({'role': 'Only superusers can create admin accounts.'})

        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data.get('role', 'client')

        user = User(**validated_data)
        user.set_password(password)

        # Admins are auto-approved; clients need admin approval
        if role == 'admin':
            user.is_approved = True
            user.is_staff = True
        else:
            user.is_approved = False

        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        # Clients must be approved
        if user.role == 'client' and not user.is_approved:
            raise serializers.ValidationError('Your account is pending admin approval.')
        data['user'] = user
        return data


class ClientApprovalSerializer(serializers.ModelSerializer):
    """Admin-only serializer for approving/rejecting client accounts."""

    class Meta:
        model = User
        fields = ['id', 'is_approved', 'is_active']
