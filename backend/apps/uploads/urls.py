from django.urls import path

from .views import ExportJsonView, ExportPdfView, PortfolioImageDetailView, PortfolioImageListCreateView

urlpatterns = [
    path(
        "portfolios/<int:portfolio_id>/images/",
        PortfolioImageListCreateView.as_view(),
        name="portfolio-images",
    ),
    path(
        "portfolio-images/<int:image_id>/",
        PortfolioImageDetailView.as_view(),
        name="portfolio-image-detail",
    ),
    path(
        "portfolios/<int:portfolio_id>/export/json/",
        ExportJsonView.as_view(),
        name="portfolio-export-json",
    ),
    path(
        "portfolios/<int:portfolio_id>/export/pdf/",
        ExportPdfView.as_view(),
        name="portfolio-export-pdf",
    ),
]
