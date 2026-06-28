from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.teams.models import Team
from apps.teams.permissions import user_can_access_team, user_is_team_member, user_is_team_teacher

from .models import InnovationBrief
from .serializers import InnovationBriefSerializer

# MVP: students can edit brief. Set to False to make students read-only.
STUDENTS_CAN_EDIT_BRIEF = getattr(settings, "STUDENTS_CAN_EDIT_BRIEF", True)


class InnovationBriefView(APIView):
    def get_team(self, team_id):
        team = get_object_or_404(Team, pk=team_id)
        if not user_can_access_team(self.request.user, team):
            return None
        return team

    def get(self, request, team_id):
        team = self.get_team(team_id)
        if not team:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        brief, _ = InnovationBrief.objects.get_or_create(team=team)
        return Response(InnovationBriefSerializer(brief).data)

    def patch(self, request, team_id):
        team = self.get_team(team_id)
        if not team:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        can_edit = user_is_team_teacher(user, team) or (
            STUDENTS_CAN_EDIT_BRIEF and user_is_team_member(user, team)
        )
        if not can_edit:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        brief, _ = InnovationBrief.objects.get_or_create(team=team)
        serializer = InnovationBriefSerializer(brief, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
