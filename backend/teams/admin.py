from django.contrib import admin
from .models import Team, Student, Stage


@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'start_date', 'end_date']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['team_name', 'track', 'risk_status', 'season', 'updated_at']
    list_filter = ['track', 'risk_status', 'season']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['name', 'team', 'grade', 'role_in_team']
