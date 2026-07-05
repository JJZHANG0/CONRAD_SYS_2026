from django.urls import path

from .operations_views import (
    OperationsCreateStudentView,
    OperationsCreateTeamView,
    OperationsDeleteTeamView,
    OperationsTeacherListView,
)
from .views import DashboardView, TeamDetailView, TeamListView

urlpatterns = [
    path("teams/", TeamListView.as_view(), name="team-list"),
    path("teams/<int:team_id>/", TeamDetailView.as_view(), name="team-detail"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("operations/teachers/", OperationsTeacherListView.as_view(), name="ops-teachers"),
    path("operations/teams/", OperationsCreateTeamView.as_view(), name="ops-create-team"),
    path("operations/teams/delete/", OperationsDeleteTeamView.as_view(), name="ops-delete-team"),
    path("operations/students/", OperationsCreateStudentView.as_view(), name="ops-create-student"),
]
