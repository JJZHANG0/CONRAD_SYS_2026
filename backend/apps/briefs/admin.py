from django.contrib import admin

from .models import InnovationBrief


@admin.register(InnovationBrief)
class InnovationBriefAdmin(admin.ModelAdmin):
    list_display = ("team", "completion_count", "updated_at")

    def completion_count(self, obj):
        return obj.completion_count()
