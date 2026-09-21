from django.contrib import admin
from .models import RiskLog, ActivityLog


@admin.register(RiskLog)
class RiskLogAdmin(admin.ModelAdmin):
    list_display = ['team', 'risk_level', 'status', 'owner', 'updated_at']
    list_filter = ['risk_level', 'status']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'team', 'user', 'created_at']
