from django.contrib import admin

from .models import DailyLog


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ("student", "team", "day", "is_complete", "has_teacher_comment", "updated_at")
    list_filter = ("day", "team")
    search_fields = ("student__username", "team__name")
