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
from .permissions import user_is_team_teacher

User = get_user_model()


def visible_teacher_evaluation_stats(serializer, team):
    request = serializer.context.get("request")
    user = getattr(request, "user", None)
    if user and (user.is_operations or user_is_team_teacher(user, team)):
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
    teacher_name = serializers.SerializerMethodField()
    co_teacher_names = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "id",
            "name",
            "project_name",
            "challenge_category",
            "teacher_name",
            "co_teacher_names",
            "stats",
            "updated_at",
        )

    def get_teacher_name(self, obj):
        return obj.teacher_names_text()

    def get_co_teacher_names(self, obj):
        return [
            user.display_name or user.username
            for user in obj.co_teachers.all()
        ]

    def get_stats(self, obj):
        log_stats = team_log_stats(obj)
        content = team_content_stats(obj)
        evaluation = visible_teacher_evaluation_stats(self, obj)
        return {**log_stats, **content, **evaluation}


class TeamDetailSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    co_teachers = UserSerializer(many=True, read_only=True)
    teacher_name = serializers.SerializerMethodField()
    members = TeamMemberSerializer(many=True, read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "id",
            "name",
            "project_name",
            "challenge_category",
            "description",
            "teacher",
            "co_teachers",
            "teacher_name",
            "members",
            "stats",
            "created_at",
            "updated_at",
        )

    def get_teacher_name(self, obj):
        return obj.teacher_names_text()

    def get_stats(self, obj):
        log_stats = team_log_stats(obj)
        content = team_content_stats(obj)
        evaluation = visible_teacher_evaluation_stats(self, obj)
        return {**log_stats, **content, **evaluation}
