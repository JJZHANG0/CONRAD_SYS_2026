from django.urls import path
from .views import (
    TeacherEvaluationListCreateView, TeacherEvaluationDetailView,
    TeamScoreListCreateView, TeamScoreDetailView, TeacherRankingView,
)

urlpatterns = [
    path('teacher/', TeacherEvaluationListCreateView.as_view(), name='teacher_eval_list'),
    path('teacher/<int:pk>/', TeacherEvaluationDetailView.as_view(), name='teacher_eval_detail'),
    path('teacher/ranking/', TeacherRankingView.as_view(), name='teacher_ranking'),
    path('team/', TeamScoreListCreateView.as_view(), name='team_score_list'),
    path('team/<int:pk>/', TeamScoreDetailView.as_view(), name='team_score_detail'),
]
