from django.contrib import admin
from .models import LessonRecord, CalendarEvent


@admin.register(LessonRecord)
class LessonRecordAdmin(admin.ModelAdmin):
    list_display = ['team', 'topic', 'lesson_time', 'admin_score', 'mentor_feedback_status']
    list_filter = ['mentor_feedback_status']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['team', 'topic', 'start_time', 'feedback_submitted']
