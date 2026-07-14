from django.urls import path

from .views import LeanCanvasReviewView, LeanCanvasView

urlpatterns = [
    path(
        "teams/<int:team_id>/lean-canvas/",
        LeanCanvasView.as_view(),
        name="lean-canvas",
    ),
    path(
        "teams/<int:team_id>/lean-canvas/reviews/",
        LeanCanvasReviewView.as_view(),
        name="lean-canvas-reviews",
    ),
]
