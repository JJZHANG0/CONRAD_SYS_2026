from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.review_status import merge_field_review
from apps.common.views import get_or_create_serialized, handle_form_database_errors, save_serialized_form
from apps.teams.models import Team
from apps.teams.permissions import (
    user_can_access_team,
    user_is_operations,
    user_is_team_member,
    user_is_team_teacher,
)

from .models import BRIEF_FIELDS, InnovationBrief
from .serializers import InnovationBriefSerializer

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
        return handle_form_database_errors(
            lambda: Response(
                get_or_create_serialized(
                    InnovationBriefSerializer,
                    team,
                    lambda t: InnovationBrief.objects.get_or_create(team=t),
                )
            )
        )

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

        def save():
            brief, _ = InnovationBrief.objects.get_or_create(team=team)
            data = save_serialized_form(brief, InnovationBriefSerializer, request.data)
            return Response(data)

        return handle_form_database_errors(save)


class InnovationBriefReviewView(APIView):
    """Operations-only: mark Brief modules as pass / fail."""

    def patch(self, request, team_id):
        team = get_object_or_404(Team, pk=team_id)
        if not user_can_access_team(request.user, team) or not user_is_operations(request.user):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        field = request.data.get("field")
        review_status = request.data.get("status")
        if not field:
            return Response({"detail": "field is required."}, status=status.HTTP_400_BAD_REQUEST)

        def save():
            brief, _ = InnovationBrief.objects.get_or_create(team=team)
            try:
                brief.field_reviews = merge_field_review(
                    brief.field_reviews, field, review_status, BRIEF_FIELDS
                )
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            brief.save(update_fields=["field_reviews", "updated_at"])
            return Response(InnovationBriefSerializer(brief).data)

        return handle_form_database_errors(save)
