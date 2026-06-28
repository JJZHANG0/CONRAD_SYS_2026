from django.urls import path

from .views import InnovationBriefView

urlpatterns = [
    path(
        "teams/<int:team_id>/innovation-brief/",
        InnovationBriefView.as_view(),
        name="innovation-brief",
    ),
]
