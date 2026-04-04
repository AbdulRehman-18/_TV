from django.contrib import admin
from .models import User, Announcement, Event, Media


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_approved', 'is_active', 'date_joined')
    list_filter = ('role', 'is_approved', 'is_active')
    search_fields = ('username', 'email', 'organization')
    list_editable = ('is_approved',)


class ScheduleFieldsMixin:
    """Reusable admin fieldset for scheduling fields."""
    schedule_fieldset = (
        'Scheduling', {
            'classes': ('collapse',),
            'fields': (
                ('schedule_start_date', 'schedule_end_date'),
                ('schedule_time_start', 'schedule_time_end'),
                'recurrence_type', 'recurrence_days',
                'priority', 'status', 'admin_notes', 'client_id',
            ),
        }
    )


@admin.register(Announcement)
class AnnouncementAdmin(ScheduleFieldsMixin, admin.ModelAdmin):
    list_display = ('title', 'priority', 'status', 'is_active', 'created_at')
    list_filter = ('is_active', 'priority', 'status', 'created_at')
    search_fields = ('title', 'body')
    fieldsets = (
        (None, {'fields': ('title', 'body', 'image', 'is_active')}),
        ScheduleFieldsMixin.schedule_fieldset,
    )


@admin.register(Event)
class EventAdmin(ScheduleFieldsMixin, admin.ModelAdmin):
    list_display = ('title', 'start_date', 'location', 'priority', 'status', 'is_active')
    list_filter = ('is_active', 'priority', 'status', 'start_date')
    search_fields = ('title', 'description', 'location')
    fieldsets = (
        (None, {'fields': ('title', 'description', 'location', 'start_date', 'end_date', 'image', 'is_active')}),
        ScheduleFieldsMixin.schedule_fieldset,
    )


@admin.register(Media)
class MediaAdmin(ScheduleFieldsMixin, admin.ModelAdmin):
    list_display = ('title', 'file_type', 'is_fallback', 'priority', 'status', 'is_active', 'created_at')
    list_filter = ('file_type', 'is_active', 'is_fallback', 'priority', 'status')
    search_fields = ('title', 'description', 'file_name')
    fieldsets = (
        (None, {'fields': ('title', 'description', 'file', 'file_type', 'file_name', 'file_size', 'is_active', 'is_fallback')}),
        ScheduleFieldsMixin.schedule_fieldset,
    )
