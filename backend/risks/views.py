from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import RiskLog, ActivityLog
from .serializers import RiskLogSerializer, ActivityLogSerializer


class RiskLogListCreateView(generics.ListCreateAPIView):
    queryset = RiskLog.objects.select_related('team', 'owner', 'created_by')
    serializer_class = RiskLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['team', 'risk_level', 'status', 'owner']
    ordering = ['-updated_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RiskLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RiskLog.objects.select_related('team', 'owner', 'created_by')
    serializer_class = RiskLogSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'resolved' and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save(update_fields=['resolved_at'])


class CriticalRisksView(generics.ListAPIView):
    serializer_class = RiskLogSerializer

    def get_queryset(self):
        return RiskLog.objects.filter(
            risk_level='critical', status__in=['open', 'in_progress']
        ).select_related('team', 'owner')


class AttentionRisksView(generics.ListAPIView):
    serializer_class = RiskLogSerializer

    def get_queryset(self):
        return RiskLog.objects.filter(
            risk_level='attention', status__in=['open', 'in_progress']
        ).select_related('team', 'owner')


class ActivityLogListView(generics.ListAPIView):
    queryset = ActivityLog.objects.select_related('team', 'user').order_by('-created_at')[:50]
    serializer_class = ActivityLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['team']
