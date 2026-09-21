from django.urls import path
from .views import TemplateListCreateView, TemplateDetailView

urlpatterns = [
    path('', TemplateListCreateView.as_view(), name='template_list'),
    path('<int:pk>/', TemplateDetailView.as_view(), name='template_detail'),
]
