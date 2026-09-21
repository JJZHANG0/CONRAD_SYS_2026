from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import TemplateResource
from .serializers import TemplateResourceSerializer


class TemplateListCreateView(generics.ListCreateAPIView):
    queryset = TemplateResource.objects.select_related('stage', 'uploaded_by')
    serializer_class = TemplateResourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['stage', 'category']
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class TemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TemplateResource.objects.select_related('stage', 'uploaded_by')
    serializer_class = TemplateResourceSerializer
