from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.briefs.models import InnovationBrief
from apps.logs.models import DailyLog
from apps.teams.models import Team, TeamMember

from .permissions import user_can_access_team, user_is_team_member, user_is_team_teacher
from .serializers import TeamDetailSerializer, TeamListSerializer
from .services import (
    next_incomplete_day,
    student_log_stats,
    team_content_stats,
    team_log_stats,
)


class TeamListView(generics.ListAPIView):
    serializer_class = TeamListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_operations:
            return Team.objects.all().prefetch_related("members")
        if user.is_teacher:
            return Team.objects.filter(teacher=user).prefetch_related("members")
        membership = TeamMember.objects.filter(student=user).select_related("team").first()
        if membership:
            return Team.objects.filter(pk=membership.team_id)
        return Team.objects.none()


class TeamDetailView(generics.RetrieveAPIView):
    serializer_class = TeamDetailSerializer
    lookup_url_kwarg = "team_id"

    def get_queryset(self):
        return Team.objects.prefetch_related("members__student", "teacher")

    def get_object(self):
        team = get_object_or_404(Team, pk=self.kwargs["team_id"])
        if not user_can_access_team(self.request.user, team):
            self.permission_denied(self.request)
        return team


class DashboardView(APIView):
    def get(self, request):
        user = request.user
        if user.is_operations:
            teams = Team.objects.all().prefetch_related("members")
            team_data = []
            for team in teams:
                stats = {**team_log_stats(team), **team_content_stats(team)}
                team_data.append({
                    "id": team.id,
                    "name": team.name,
                    "project_name": team.project_name,
                    "challenge_category": team.challenge_category,
                    "teacher_name": team.teacher.display_name,
                    **stats,
                })
            return Response({"role": "operations", "teams": team_data})

        if user.is_teacher:
            teams = Team.objects.filter(teacher=user).prefetch_related("members")
            team_data = []
            for team in teams:
                stats = {**team_log_stats(team), **team_content_stats(team)}
                team_data.append({
                    "id": team.id,
                    "name": team.name,
                    "project_name": team.project_name,
                    "challenge_category": team.challenge_category,
                    **stats,
                })
            return Response({"role": "teacher", "teams": team_data})

        membership = TeamMember.objects.filter(student=user).select_related("team", "team__teacher").first()
        if not membership:
            return Response({
                "role": "student",
                "team": None,
                "my_log_completion": 0,
                "teacher_comment_count": 0,
                "next_incomplete_day": 1,
            })

        team = membership.team
        stats = student_log_stats(user, team)
        return Response({
            "role": "student",
            "team": {
                "id": team.id,
                "name": team.name,
                "project_name": team.project_name,
                "challenge_category": team.challenge_category,
                "teacher_name": team.teacher.display_name,
            },
            "my_log_completion": stats["log_completion_count"],
            "teacher_comment_count": stats["teacher_comment_count"],
            "next_incomplete_day": next_incomplete_day(user, team) or 1,
            "total_log_count": 5,
        })
