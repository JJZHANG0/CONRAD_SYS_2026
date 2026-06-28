from django.urls import path

from .views import LogUpdateView, MyLogsView, StudentLogsView

urlpatterns = [
    path("my/logs/", MyLogsView.as_view(), name="my-logs"),
    path(
        "teams/<int:team_id>/students/<int:student_id>/logs/",
        StudentLogsView.as_view(),
        name="student-logs",
    ),
    path("logs/<int:log_id>/", LogUpdateView.as_view(), name="log-update"),
]
