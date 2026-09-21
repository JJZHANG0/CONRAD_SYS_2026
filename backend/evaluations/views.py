from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import TeacherEvaluation, TeamScore
from .serializers import TeacherEvaluationSerializer, TeamScoreSerializer

User = get_user_model()


class TeacherEvaluationListCreateView(generics.ListCreateAPIView):
    queryset = TeacherEvaluation.objects.select_related('mentor', 'team', 'evaluated_by')
    serializer_class = TeacherEvaluationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['mentor', 'team', 'season', 'level']
    ordering_fields = ['total_score', 'updated_at']
    ordering = ['-total_score']

    def perform_create(self, serializer):
        serializer.save(evaluated_by=self.request.user)


class TeacherEvaluationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeacherEvaluation.objects.select_related('mentor', 'team', 'evaluated_by')
    serializer_class = TeacherEvaluationSerializer


class TeamScoreListCreateView(generics.ListCreateAPIView):
    queryset = TeamScore.objects.select_related('team', 'evaluated_by')
    serializer_class = TeamScoreSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['team']
    ordering = ['-total_score']

    def perform_create(self, serializer):
        serializer.save(evaluated_by=self.request.user)


class TeamScoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeamScore.objects.select_related('team', 'evaluated_by')
    serializer_class = TeamScoreSerializer


class TeacherRankingView(APIView):
    def get(self, request):
        mentors = User.objects.filter(role='mentor')
        ranking = []
        for mentor in mentors:
            evals = TeacherEvaluation.objects.filter(mentor=mentor)
            avg_score = evals.aggregate(avg=Avg('total_score'))['avg'] or 0
            team_count = mentor.mentor_teams.count()
            ranking.append({
                'id': mentor.id,
                'name': mentor.name,
                'team_count': team_count,
                'avg_score': round(avg_score, 1),
                'level': evals.first().level if evals.exists() else 'N/A',
                'evaluation_count': evals.count(),
            })
        ranking.sort(key=lambda x: x['avg_score'], reverse=True)
        return Response(ranking)
