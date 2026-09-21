from django.contrib import admin
from .models import TeacherEvaluation, TeamScore


@admin.register(TeacherEvaluation)
class TeacherEvaluationAdmin(admin.ModelAdmin):
    list_display = ['mentor', 'team', 'total_score', 'level']


@admin.register(TeamScore)
class TeamScoreAdmin(admin.ModelAdmin):
    list_display = ['team', 'total_score', 'updated_at']
