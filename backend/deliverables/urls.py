from django.urls import path
from .views import DeliverableListCreateView, DeliverableDetailView, DeliverableReviewView

urlpatterns = [
    path('', DeliverableListCreateView.as_view(), name='deliverable_list'),
    path('<int:pk>/', DeliverableDetailView.as_view(), name='deliverable_detail'),
    path('<int:pk>/review/', DeliverableReviewView.as_view(), name='deliverable_review'),
]
