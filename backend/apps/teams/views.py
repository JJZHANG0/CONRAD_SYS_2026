from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.db import run_with_db_retry
from apps.common.views import handle_form_database_errors
from apps.teams.models import Team, TeacherDailyEvaluation, TeamMember

from .permissions import user_can_access_team, user_is_team_teacher
from .serializers import (
    TeacherDailyEvaluationSerializer,
    TeamDetailSerializer,
    TeamListSerializer,
)
from .services import (
    next_incomplete_day,
    student_log_stats,
    teacher_evaluation_stats,
    team_content_stats,
    team_log_stats,
)


def teams_for_teacher(user):
    return (
        Team.objects.filter(Q(teacher=user) | Q(co_teachers=user))
        .select_related("teacher")
        .prefetch_related("members", "teacher_evaluations", "co_teachers")
        .distinct()
    )


class TeamListView(generics.ListAPIView):
    serializer_class = TeamListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_operations:
            return Team.objects.all().prefetch_related(
                "members", "teacher_evaluations", "co_teachers"
            )
        if user.is_teacher:
            return teams_for_teacher(user)
        membership = TeamMember.objects.filter(student=user).select_related("team").first()
        if membership:
            return Team.objects.filter(pk=membership.team_id).prefetch_related(
                "co_teachers"
            )
        return Team.objects.none()


class TeamDetailView(generics.RetrieveAPIView):
    serializer_class = TeamDetailSerializer
    lookup_url_kwarg = "team_id"

    def get_queryset(self):
        return Team.objects.prefetch_related(
            "members__student", "teacher_evaluations", "co_teachers"
        ).select_related("teacher")

    def get_object(self):
        team = get_object_or_404(Team, pk=self.kwargs["team_id"])
        if not user_can_access_team(self.request.user, team):
            self.permission_denied(self.request)
        return team


class DashboardView(APIView):
    def get(self, request):
        user = request.user
        if user.is_operations:
            teams = Team.objects.all().select_related("teacher").prefetch_related(
                "members", "teacher_evaluations", "co_teachers"
            )
            team_data = []
            for team in teams:
                stats = {
                    **team_log_stats(team),
                    **team_content_stats(team),
                    **teacher_evaluation_stats(team),
                }
                team_data.append({
                    "id": team.id,
                    "name": team.name,
                    "project_name": team.project_name,
                    "challenge_category": team.challenge_category,
                    "teacher_name": team.teacher_names_text(),
                    **stats,
                })
            return Response({"role": "operations", "teams": team_data})

        if user.is_teacher:
            teams = teams_for_teacher(user)
            team_data = []
            for team in teams:
                stats = {
                    **team_log_stats(team),
                    **team_content_stats(team),
                    **teacher_evaluation_stats(team),
                }
                team_data.append({
                    "id": team.id,
                    "name": team.name,
                    "project_name": team.project_name,
                    "challenge_category": team.challenge_category,
                    "teacher_name": team.teacher_names_text(),
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
                "teacher_name": team.teacher_names_text(),
            },
            "my_log_completion": stats["log_completion_count"],
            "teacher_comment_count": stats["teacher_comment_count"],
            "next_incomplete_day": next_incomplete_day(user, team) or 1,
            "total_log_count": 5,
        })


class TeacherEvaluationListView(APIView):
    def get(self, request, team_id):
        team = get_object_or_404(Team, pk=team_id)
        can_view = request.user.is_operations or user_is_team_teacher(
            request.user, team
        )
        if not can_view:
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )
        evaluations = team.teacher_evaluations.select_related(
            "reviewed_by"
        ).order_by("day")
        return Response(TeacherDailyEvaluationSerializer(evaluations, many=True).data)


class TeacherEvaluationUpdateView(APIView):
    def patch(self, request, team_id, day):
        if not request.user.is_operations:
            return Response(
                {"detail": "Only operations accounts can edit teacher evaluations."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if day not in range(1, 6):
            return Response(
                {"detail": "Day must be between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        team = get_object_or_404(Team, pk=team_id)

        def save_evaluation():
            request_data = request.data.copy()
            # The comment is a single five-day summary stored with Day 5.
            # Earlier days contain objective checklist scores only.
            if day != 5:
                request_data["comment"] = ""
            evaluation, _ = run_with_db_retry(
                lambda: TeacherDailyEvaluation.objects.get_or_create(
                    team=team,
                    day=day,
                )
            )
            serializer = TeacherDailyEvaluationSerializer(
                evaluation,
                data=request_data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            saved = serializer.save(reviewed_by=request.user)
            saved.refresh_from_db()
            return Response(TeacherDailyEvaluationSerializer(saved).data)

        return handle_form_database_errors(save_evaluation)
