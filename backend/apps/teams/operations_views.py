from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsOperations

from .operations_serializers import (
    OperationsCreateStudentSerializer,
    OperationsCreateTeamSerializer,
    OperationsDeleteTeamSerializer,
    OperationsTeacherSerializer,
)
from .serializers import TeamListSerializer


class OperationsTeacherListView(APIView):
    permission_classes = [IsOperations]

    def get(self, request):
        teachers = User.objects.filter(role=User.Role.TEACHER).order_by("display_name")
        return Response(OperationsTeacherSerializer(teachers, many=True).data)


class OperationsCreateTeamView(APIView):
    permission_classes = [IsOperations]

    def post(self, request):
        serializer = OperationsCreateTeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = serializer.save()
        return Response(TeamListSerializer(team).data, status=status.HTTP_201_CREATED)


class OperationsCreateStudentView(APIView):
    permission_classes = [IsOperations]

    def post(self, request):
        serializer = OperationsCreateStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "email": user.email,
                "team_id": serializer.context["team"].id,
            },
            status=status.HTTP_201_CREATED,
        )


class OperationsDeleteTeamView(APIView):
    permission_classes = [IsOperations]

    def post(self, request):
        serializer = OperationsDeleteTeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = serializer.validated_data["team"]
        name = team.name
        team.delete()
        return Response({"message": f"Team '{name}' has been deleted."})
