from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.portfolios.models import PortfolioPageData, PortfolioProject
from apps.portfolios.permissions import user_can_access_portfolio

from .models import PageReview
from .serializers import PageReviewSerializer, PageReviewUpdateSerializer


def user_can_review_portfolio(user, portfolio):
    if not user.is_authenticated:
        return False
    if user.is_admin_user:
        return True
    if user.is_teacher and portfolio.assigned_teacher_id == user.id:
        return True
    return False


class ReviewListView(generics.ListAPIView):
    serializer_class = PageReviewSerializer

    def get_queryset(self):
        portfolio = get_object_or_404(
            PortfolioProject,
            pk=self.kwargs["portfolio_id"],
        )
        if not user_can_access_portfolio(self.request.user, portfolio):
            self.permission_denied(self.request)
        return PageReview.objects.filter(portfolio=portfolio)


class ReviewDetailView(APIView):
    def get_portfolio(self, portfolio_id):
        portfolio = get_object_or_404(PortfolioProject, pk=portfolio_id)
        if not user_can_access_portfolio(self.request.user, portfolio):
            self.permission_denied(self.request)
        return portfolio

    def get(self, request, portfolio_id, page_id):
        portfolio = self.get_portfolio(portfolio_id)
        page_data = get_object_or_404(
            PortfolioPageData,
            portfolio=portfolio,
            page_id=page_id,
        )
        review, _ = PageReview.objects.get_or_create(
            portfolio=portfolio,
            page_data=page_data,
            defaults={"reviewer": request.user if request.user.is_teacher else None},
        )
        return Response(PageReviewSerializer(review).data)

    def patch(self, request, portfolio_id, page_id):
        portfolio = self.get_portfolio(portfolio_id)
        if not user_can_review_portfolio(request.user, portfolio):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        page_data = get_object_or_404(
            PortfolioPageData,
            portfolio=portfolio,
            page_id=page_id,
        )
        review, _ = PageReview.objects.get_or_create(
            portfolio=portfolio,
            page_data=page_data,
        )
        review.reviewer = request.user
        serializer = PageReviewUpdateSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if portfolio.status == "submitted":
            portfolio.status = "under_review"
            portfolio.save(update_fields=["status", "updated_at"])

        return Response(PageReviewSerializer(review).data)

    def post(self, request, portfolio_id, page_id):
        return self.patch(request, portfolio_id, page_id)


class PortfolioOverallReviewView(APIView):
    def patch(self, request, portfolio_id):
        portfolio = get_object_or_404(PortfolioProject, pk=portfolio_id)
        if not user_can_review_portfolio(request.user, portfolio):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("status")
        if new_status not in ("need_revision", "approved", "under_review"):
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        portfolio.status = new_status
        portfolio.save(update_fields=["status", "updated_at"])
        return Response({"status": portfolio.status, "message": "Portfolio status updated."})
