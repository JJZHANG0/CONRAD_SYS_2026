from django.contrib import admin

from .models import Team, TeacherDailyEvaluation, TeamMember


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    max_num = 5


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "project_name", "teacher", "challenge_category", "updated_at")
    list_filter = ("challenge_category",)
    search_fields = ("name", "project_name")
    filter_horizontal = ("co_teachers",)
    inlines = [TeamMemberInline]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("team", "student", "student_role", "created_at")
    search_fields = ("team__name", "student__username")


@admin.register(TeacherDailyEvaluation)
class TeacherDailyEvaluationAdmin(admin.ModelAdmin):
    list_display = (
        "team",
        "day",
        "total_score",
        "reviewed_by",
        "updated_at",
    )
    list_filter = ("day",)
    search_fields = ("team__name", "team__teacher__display_name")
