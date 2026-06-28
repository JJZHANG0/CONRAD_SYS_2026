from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PageDataDetailView, PageDataListView, PortfolioViewSet

router = DefaultRouter()
router.register(r"portfolios", PortfolioViewSet, basename="portfolio")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "portfolios/<int:portfolio_id>/pages/",
        PageDataListView.as_view(),
        name="portfolio-pages",
    ),
    path(
        "portfolios/<int:portfolio_id>/pages/<str:page_id>/",
        PageDataDetailView.as_view(),
        name="portfolio-page-detail",
    ),
]
