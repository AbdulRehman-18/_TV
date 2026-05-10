from rest_framework import permissions


def is_admin_user(user):
    return bool(
        user
        and user.is_authenticated
        and (
            getattr(user, 'is_admin', False)
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )
    )


class ContentWorkflowPermission(permissions.BasePermission):
    """
    Content workflow:
    - Anyone can read public approved content.
    - Clients can create pending submissions.
    - Clients can edit/delete only their own pending submissions.
    - Admins can approve/reject/update/delete all submissions.
    """

    def has_permission(self, request, view):
        if view.action in ('list', 'retrieve'):
            return True
        if view.action == 'create':
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if is_admin_user(request.user):
            return True

        is_owner = obj.client_id == request.user.id
        if view.action == 'destroy':
            return is_owner and obj.status == 'pending'
        if view.action in ('update', 'partial_update'):
            return is_owner and obj.status == 'pending'

        return False


class ContentWorkflowMixin:
    ordering = '-created_at'

    def get_queryset(self):
        queryset = self.queryset.all().order_by(self.ordering)
        user = self.request.user

        if is_admin_user(user):
            return queryset

        if user and user.is_authenticated:
            return queryset.filter(client_id=user.id)

        return queryset.filter(is_active=True, status='approved')

    def perform_create(self, serializer):
        if is_admin_user(self.request.user):
            serializer.save()
            return

        serializer.save(
            client=self.request.user,
            status='pending',
            is_active=False,
            admin_notes='',
        )

    def perform_update(self, serializer):
        if is_admin_user(self.request.user):
            serializer.save()
            return

        serializer.save(
            client=self.request.user,
            status='pending',
            is_active=False,
        )
