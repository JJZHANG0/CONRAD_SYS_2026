from django.urls import path

from .views import PortfolioOverallReviewView, ReviewDetailView, ReviewListView

urlpatterns = [
    path(
        "portfolios/<int:portfolio_id>/reviews/",
        ReviewListView.as_view(),
        name="portfolio-reviews",
    ),
    path(
        "portfolios/<int:portfolio_id>/reviews/<str:page_id>/",
        ReviewDetailView.as_view(),
        name="portfolio-review-detail",
    ),
    path(
        "portfolios/<int:portfolio_id>/reviews/overall/",
        PortfolioOverallReviewView.as_view(),
        name="portfolio-review-overall",
    ),
]
