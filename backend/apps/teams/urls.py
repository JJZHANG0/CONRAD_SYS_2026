from django.urls import path

from .views import DashboardView, TeamDetailView, TeamListView

urlpatterns = [
    path("teams/", TeamListView.as_view(), name="team-list"),
    path("teams/<int:team_id>/", TeamDetailView.as_view(), name="team-detail"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]
