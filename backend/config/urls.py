"""URL configuration for Conrad Team Command Center."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/', include('accounts.urls')),
    path('api/teams/', include('teams.urls')),
    path('api/deliverables/', include('deliverables.urls')),
    path('api/lessons/', include('lessons.urls')),
    path('api/evaluations/', include('evaluations.urls')),
    path('api/risks/', include('risks.urls')),
    path('api/templates/', include('templates_lib.urls')),
    path('api/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
