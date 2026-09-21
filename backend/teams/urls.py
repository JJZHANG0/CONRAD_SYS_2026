from django.urls import path
from .views import (
    StageListView, TeamListCreateView, TeamDetailView,
    StudentListCreateView, StudentDetailView,
)

urlpatterns = [
    path('stages/', StageListView.as_view(), name='stage_list'),
    path('', TeamListCreateView.as_view(), name='team_list'),
    path('<int:pk>/', TeamDetailView.as_view(), name='team_detail'),
    path('students/', StudentListCreateView.as_view(), name='student_list'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student_detail'),
]
