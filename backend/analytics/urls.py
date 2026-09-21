from django.urls import path
from .views import DashboardOverviewView, StageCompletionView, AnalyticsDetailView

urlpatterns = [
    path('dashboard/', DashboardOverviewView.as_view(), name='dashboard_overview'),
    path('stage-completion/', StageCompletionView.as_view(), name='stage_completion'),
    path('detail/', AnalyticsDetailView.as_view(), name='analytics_detail'),
]
