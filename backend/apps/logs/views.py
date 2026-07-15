from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.db import run_with_db_retry
from apps.common.views import handle_form_database_errors
from apps.teams.models import Team, TeamMember
from apps.teams.permissions import user_can_access_team, user_can_review_team, user_is_operations

from .models import DailyLog
from .serializers import DailyLogSerializer, StudentLogUpdateSerializer, TeacherCommentUpdateSerializer


def update_log_with_retry(log, serializer_class, request_data):
    """Validate and persist one log update with SQLite lock retries."""

    def persist():
        serializer = serializer_class(log, data=request_data, partial=True)
        serializer.is_valid(raise_exception=True)
        saved = serializer.save()
        saved.refresh_from_db()
        return DailyLogSerializer(saved).data

    return run_with_db_retry(persist)


class MyLogsView(APIView):
    def get(self, request):
        membership = TeamMember.objects.filter(student=request.user).select_related("team").first()
        if not membership:
            return Response([])
        logs = DailyLog.objects.filter(team=membership.team, student=request.user).order_by("day")
        return Response(DailyLogSerializer(logs, many=True).data)


class StudentLogsView(APIView):
    def get(self, request, team_id, student_id):
        team = get_object_or_404(Team, pk=team_id)
        if not user_can_access_team(request.user, team):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.is_student:
            if request.user.id != student_id:
                return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.is_teacher:
            if not user_can_review_team(request.user, team):
                return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        elif not user_is_operations(request.user):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        logs = DailyLog.objects.filter(team=team, student_id=student_id).order_by("day")
        return Response(DailyLogSerializer(logs, many=True).data)


class LogUpdateView(APIView):
    def patch(self, request, log_id):
        log = get_object_or_404(DailyLog, pk=log_id)
        user = request.user

        if user.is_student and log.student_id == user.id:
            return handle_form_database_errors(
                lambda: Response(
                    update_log_with_retry(log, StudentLogUpdateSerializer, request.data)
                )
            )

        if user_can_review_team(user, log.team):
            return handle_form_database_errors(
                lambda: Response(
                    update_log_with_retry(
                        log, TeacherCommentUpdateSerializer, request.data
                    )
                )
            )

        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
