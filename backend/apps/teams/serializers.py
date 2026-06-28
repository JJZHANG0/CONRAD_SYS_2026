from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.teams.services import brief_stats, student_log_stats, team_log_stats

from .models import Team, TeamMember

User = get_user_model()


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
        brief = brief_stats(obj)
        return {**log_stats, **brief}


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
        brief = brief_stats(obj)
        return {**log_stats, **brief}
