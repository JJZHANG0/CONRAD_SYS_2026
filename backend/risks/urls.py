from django.urls import path
from .views import (
    RiskLogListCreateView, RiskLogDetailView,
    CriticalRisksView, AttentionRisksView, ActivityLogListView,
)

urlpatterns = [
    path('', RiskLogListCreateView.as_view(), name='risk_list'),
    path('<int:pk>/', RiskLogDetailView.as_view(), name='risk_detail'),
    path('critical/', CriticalRisksView.as_view(), name='critical_risks'),
    path('attention/', AttentionRisksView.as_view(), name='attention_risks'),
    path('activities/', ActivityLogListView.as_view(), name='activity_list'),
]
