from django.urls import path

from .views import LeanCanvasView

urlpatterns = [
    path(
        "teams/<int:team_id>/lean-canvas/",
        LeanCanvasView.as_view(),
        name="lean-canvas",
    ),
]
