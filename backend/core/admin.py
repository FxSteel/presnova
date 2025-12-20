from django.contrib import admin
from .models import Song, SongSection


class SongSectionInline(admin.TabularInline):
    model = SongSection
    extra = 1
    ordering = ['order']


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'key', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['title', 'author']
    inlines = [SongSectionInline]


@admin.register(SongSection)
class SongSectionAdmin(admin.ModelAdmin):
    list_display = ['song', 'section_type', 'order']
    list_filter = ['section_type']
    search_fields = ['song__title', 'text']

