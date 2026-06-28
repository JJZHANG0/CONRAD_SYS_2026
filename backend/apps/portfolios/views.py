from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin

from .models import PortfolioPageData, PortfolioProject
from .permissions import PortfolioAccessPermission, PortfolioEditPermission, user_can_access_portfolio
from .serializers import (
    PortfolioCreateSerializer,
    PortfolioDetailSerializer,
    PortfolioListSerializer,
    PortfolioPageDataSerializer,
    PortfolioPageUpdateSerializer,
)
from .services import compute_page_status, update_portfolio_completion


class PortfolioViewSet(viewsets.ModelViewSet):
    permission_classes = [PortfolioAccessPermission]

    def get_queryset(self):
        user = self.request.user
        qs = PortfolioProject.objects.select_related("owner", "assigned_teacher").prefetch_related(
            "pages", "images"
        )
        if user.is_admin_user or user.is_superuser:
            return qs
        if user.is_teacher:
            return qs.filter(assigned_teacher=user)
        return qs.filter(owner=user)

    def get_serializer_class(self):
        if self.action == "create":
            return PortfolioCreateSerializer
        if self.action == "retrieve":
            return PortfolioDetailSerializer
        return PortfolioListSerializer

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update"):
            return [PortfolioEditPermission()]
        return [PortfolioAccessPermission()]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["get"])
    def completion(self, request, pk=None):
        portfolio = self.get_object()
        pages = portfolio.pages.all()
        completed = sum(1 for p in pages if p.status == "completed")
        in_progress = sum(1 for p in pages if p.status == "in_progress")
        not_started = sum(1 for p in pages if p.status == "not_started")
        return Response(
            {
                "completion_rate": portfolio.completion_rate,
                "total_pages": pages.count(),
                "completed_pages": completed,
                "in_progress_pages": in_progress,
                "not_started_pages": not_started,
            }
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        portfolio = self.get_object()
        if portfolio.owner_id != request.user.id and not request.user.is_admin_user:
            return Response({"detail": "Only the owner can submit."}, status=status.HTTP_403_FORBIDDEN)

        if portfolio.status not in ("draft", "in_progress", "need_revision"):
            return Response(
                {"detail": f"Cannot submit from status: {portfolio.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        portfolio.status = "submitted"
        portfolio.save(update_fields=["status", "updated_at"])
        return Response({"status": portfolio.status, "message": "Portfolio submitted for review."})


class PageDataListView(generics.ListAPIView):
    serializer_class = PortfolioPageDataSerializer

    def get_queryset(self):
        portfolio = get_object_or_404(
            PortfolioProject,
            pk=self.kwargs["portfolio_id"],
        )
        if not user_can_access_portfolio(self.request.user, portfolio):
            self.permission_denied(self.request)
        return portfolio.pages.all()


class PageDataDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PortfolioPageDataSerializer
    lookup_field = "page_id"
    lookup_url_kwarg = "page_id"

    def get_queryset(self):
        portfolio = get_object_or_404(
            PortfolioProject,
            pk=self.kwargs["portfolio_id"],
        )
        if not user_can_access_portfolio(self.request.user, portfolio):
            self.permission_denied(self.request)
        return portfolio.pages.all()

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return PortfolioPageUpdateSerializer
        return PortfolioPageDataSerializer

    def update(self, request, *args, **kwargs):
        portfolio = get_object_or_404(
            PortfolioProject,
            pk=self.kwargs["portfolio_id"],
        )
        if portfolio.owner_id != request.user.id and not request.user.is_admin_user:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = PortfolioPageUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if "fields" in serializer.validated_data:
            merged_fields = {**(instance.fields or {}), **serializer.validated_data["fields"]}
            instance.fields = merged_fields

        if "status" in serializer.validated_data:
            instance.status = serializer.validated_data["status"]

        instance.save()
        update_portfolio_completion(portfolio)
        instance.refresh_from_db()

        return Response(PortfolioPageDataSerializer(instance).data)
