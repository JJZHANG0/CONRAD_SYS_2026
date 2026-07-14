from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.health import health
from apps.common.views_translate import TranslateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/translate/", TranslateView.as_view(), name="translate"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.teams.urls")),
    path("api/", include("apps.logs.urls")),
    path("api/", include("apps.briefs.urls")),
    path("api/", include("apps.bmc.urls")),
]
