from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.teams.services import (
    student_log_stats,
    teacher_evaluation_stats,
    team_content_stats,
    team_log_stats,
)

from .models import Team, TeacherDailyEvaluation, TeamMember

User = get_user_model()


def visible_teacher_evaluation_stats(serializer, team):
    request = serializer.context.get("request")
    user = getattr(request, "user", None)
    if user and (
        user.is_operations or (user.is_teacher and team.teacher_id == user.id)
    ):
        return teacher_evaluation_stats(team)
    return {}


class TeacherDailyEvaluationSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.display_name", read_only=True, default=""
    )
    business_score = serializers.IntegerField(read_only=True)
    engineering_score = serializers.IntegerField(read_only=True)
    total_score = serializers.IntegerField(read_only=True)
    comment = serializers.CharField(
        allow_blank=True, required=False, max_length=2000
    )

    class Meta:
        model = TeacherDailyEvaluation
        fields = (
            "id",
            "day",
            *TeacherDailyEvaluation.CHECK_FIELDS,
            "business_score",
            "engineering_score",
            "total_score",
            "comment",
            "reviewed_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "day",
            "business_score",
            "engineering_score",
            "total_score",
            "reviewed_by_name",
            "created_at",
            "updated_at",
        )


class TeamMemberSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ("id", "student", "student_role", "stats", "created_at")

    def get_stats(self, obj):
        return student_log_stats(obj.student, obj.team)


class TeamListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.display_name", read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "id", "name", "project_name", "challenge_category",
            "teacher_name", "stats", "updated_at",
        )

    def get_stats(self, obj):
        log_stats = team_log_stats(obj)
        content = team_content_stats(obj)
        evaluation = visible_teacher_evaluation_stats(self, obj)
        return {**log_stats, **content, **evaluation}


class TeamDetailSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    members = TeamMemberSerializer(many=True, read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "id", "name", "project_name", "challenge_category",
            "description", "teacher", "members", "stats",
            "created_at", "updated_at",
        )

    def get_stats(self, obj):
        log_stats = team_log_stats(obj)
        content = team_content_stats(obj)
        evaluation = visible_teacher_evaluation_stats(self, obj)
        return {**log_stats, **content, **evaluation}
