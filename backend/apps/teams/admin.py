from django.contrib import admin

from .models import Team, TeamMember


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    max_num = 5


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "project_name", "teacher", "challenge_category", "updated_at")
    list_filter = ("challenge_category",)
    search_fields = ("name", "project_name")
    inlines = [TeamMemberInline]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("team", "student", "student_role", "created_at")
    search_fields = ("team__name", "student__username")
