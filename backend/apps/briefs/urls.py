from django.urls import path

from .views import InnovationBriefReviewView, InnovationBriefView

urlpatterns = [
    path(
        "teams/<int:team_id>/innovation-brief/",
        InnovationBriefView.as_view(),
        name="innovation-brief",
    ),
    path(
        "teams/<int:team_id>/innovation-brief/reviews/",
        InnovationBriefReviewView.as_view(),
        name="innovation-brief-reviews",
    ),
]
