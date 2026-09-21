from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Deliverable
from .serializers import DeliverableSerializer, DeliverableReviewSerializer


class DeliverableListCreateView(generics.ListCreateAPIView):
    queryset = Deliverable.objects.select_related('team', 'stage', 'owner', 'reviewer')
    serializer_class = DeliverableSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['team', 'stage', 'status', 'owner']
    search_fields = ['title']
    ordering_fields = ['due_date', 'updated_at', 'status']
    ordering = ['due_date']


class DeliverableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Deliverable.objects.select_related('team', 'stage', 'owner', 'reviewer')
    serializer_class = DeliverableSerializer


class DeliverableReviewView(generics.UpdateAPIView):
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableReviewSerializer

    def perform_update(self, serializer):
        from django.utils import timezone
        instance = serializer.save(reviewer=self.request.user)
        if instance.status == 'submitted' and not instance.submitted_at:
            instance.submitted_at = timezone.now()
            instance.save(update_fields=['submitted_at'])
