from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User
from ..serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, ClientApprovalSerializer,
)


class RegisterView(APIView):
    """Register a new admin or client user."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': (
                'Registration successful.'
                if user.role == 'admin'
                else 'Registration successful. Pending admin approval.'
            ),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login for both admin and client users. Returns JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
        })


class MeView(APIView):
    """Get the currently authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ClientListView(APIView):
    """Admin-only: list all client users (pending + approved)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        clients = User.objects.filter(role='client').order_by('-date_joined')
        return Response(UserSerializer(clients, many=True).data)


class ClientApprovalView(APIView):
    """Admin-only: approve or reject a client account."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            client = User.objects.get(pk=pk, role='client')
        except User.DoesNotExist:
            return Response(
                {'error': 'Client not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ClientApprovalSerializer(client, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(client).data)
