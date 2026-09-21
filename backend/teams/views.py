from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Team, Student, Stage
from .serializers import (
    TeamListSerializer, TeamDetailSerializer, TeamCreateUpdateSerializer,
    StudentSerializer, StageSerializer,
)


class StageListView(generics.ListAPIView):
    queryset = Stage.objects.all()
    serializer_class = StageSerializer
    filter_backends = []


class TeamListCreateView(generics.ListCreateAPIView):
    queryset = Team.objects.select_related(
        'project_manager', 'academic_admin', 'lead_mentor', 'current_stage'
    ).prefetch_related('members')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['track', 'risk_status', 'current_stage', 'project_manager', 'lead_mentor', 'season']
    search_fields = ['team_name', 'project_name_cn', 'project_name_en']
    ordering_fields = ['deliverable_completion_rate', 'mentor_score', 'updated_at', 'team_name']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TeamCreateUpdateSerializer
        return TeamListSerializer


class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Team.objects.select_related(
        'project_manager', 'academic_admin', 'lead_mentor', 'current_stage'
    ).prefetch_related('members')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return TeamCreateUpdateSerializer
        return TeamDetailSerializer


class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['team']

    def get_queryset(self):
        return Student.objects.select_related('team')


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
