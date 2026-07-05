from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.teams.models import Team, TeamMember
from apps.teams.permissions import user_can_access_team, user_can_review_team, user_is_operations

from .models import DailyLog
from .serializers import DailyLogSerializer, StudentLogUpdateSerializer, TeacherCommentUpdateSerializer


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
            serializer = StudentLogUpdateSerializer(log, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(DailyLogSerializer(log).data)

        if user_can_review_team(user, log.team):
            serializer = TeacherCommentUpdateSerializer(log, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(DailyLogSerializer(log).data)

        return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
