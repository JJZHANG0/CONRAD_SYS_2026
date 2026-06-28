from django.conf import settings
from django.shortcuts import get_object_or_404
from PIL import Image
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.portfolios.models import PortfolioPageData, PortfolioProject
from apps.portfolios.permissions import user_can_access_portfolio, user_can_edit_portfolio
from apps.portfolios.services import update_portfolio_completion

from .models import PortfolioImage
from .serializers import PortfolioImageSerializer


class PortfolioImageListCreateView(generics.ListCreateAPIView):
    serializer_class = PortfolioImageSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_portfolio(self):
        portfolio = get_object_or_404(
            PortfolioProject,
            pk=self.kwargs["portfolio_id"],
        )
        if not user_can_access_portfolio(self.request.user, portfolio):
            self.permission_denied(self.request)
        return portfolio

    def get_queryset(self):
        portfolio = self.get_portfolio()
        qs = PortfolioImage.objects.filter(portfolio=portfolio)
        page_id = self.request.query_params.get("page_id")
        field_id = self.request.query_params.get("field_id")
        if page_id:
            qs = qs.filter(page_data__page_id=page_id)
        if field_id:
            qs = qs.filter(field_id=field_id)
        return qs

    def create(self, request, *args, **kwargs):
        portfolio = self.get_portfolio()
        if not user_can_edit_portfolio(request.user, portfolio):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        page_id = request.data.get("page_id")
        field_id = request.data.get("field_id")
        image_file = request.FILES.get("image")

        if not page_id or not field_id or not image_file:
            raise ValidationError({"detail": "page_id, field_id, and image are required."})

        content_type = getattr(image_file, "content_type", "")
        if content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise ValidationError({"detail": "Invalid image format. Allowed: jpg, jpeg, png, webp."})

        if image_file.size > settings.MAX_UPLOAD_SIZE:
            raise ValidationError({"detail": "Image size exceeds 5MB limit."})

        page_data = get_object_or_404(
            PortfolioPageData,
            portfolio=portfolio,
            page_id=page_id,
        )

        try:
            img = Image.open(image_file)
            width, height = img.size
        except Exception:
            width, height = 0, 0

        image_file.seek(0)
        sort_order = int(request.data.get("sort_order", 0))

        portfolio_image = PortfolioImage.objects.create(
            portfolio=portfolio,
            page_data=page_data,
            field_id=field_id,
            image=image_file,
            original_filename=image_file.name,
            file_size=image_file.size,
            width=width,
            height=height,
            sort_order=sort_order,
            uploaded_by=request.user,
        )

        update_portfolio_completion(portfolio)

        serializer = self.get_serializer(portfolio_image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PortfolioImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PortfolioImageSerializer
    queryset = PortfolioImage.objects.all()
    lookup_url_kwarg = "image_id"

    def get_object(self):
        obj = super().get_object()
        if not user_can_access_portfolio(self.request.user, obj.portfolio):
            self.permission_denied(self.request)
        return obj

    def perform_destroy(self, instance):
        if not user_can_edit_portfolio(self.request.user, instance.portfolio):
            self.permission_denied(self.request)
        portfolio = instance.portfolio
        instance.delete()
        update_portfolio_completion(portfolio)

    def perform_update(self, serializer):
        if not user_can_edit_portfolio(self.request.user, serializer.instance.portfolio):
            self.permission_denied(self.request)
        serializer.save()


class ExportJsonView(APIView):
    def get(self, request, portfolio_id):
        portfolio = get_object_or_404(PortfolioProject, pk=portfolio_id)
        if not user_can_access_portfolio(request.user, portfolio):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        from apps.portfolios.serializers import PortfolioDetailSerializer

        data = PortfolioDetailSerializer(portfolio, context={"request": request}).data
        return Response(data)


class ExportPdfView(APIView):
    def post(self, request, portfolio_id):
        portfolio = get_object_or_404(PortfolioProject, pk=portfolio_id)
        if not user_can_access_portfolio(request.user, portfolio):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"message": "PDF export service is not implemented yet."})
