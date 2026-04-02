from django.contrib import admin
from .models import Announcement, Event, Media

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'body')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_date', 'location', 'is_active')
    list_filter = ('is_active', 'start_date')
    search_fields = ('title', 'description', 'location')

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'file_type', 'is_active', 'created_at')
    list_filter = ('file_type', 'is_active')
    search_fields = ('title', 'description', 'file_name')
