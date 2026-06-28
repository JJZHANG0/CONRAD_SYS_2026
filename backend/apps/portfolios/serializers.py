from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.reviews.models import PageReview
from apps.uploads.models import PortfolioImage
from apps.uploads.serializers import PortfolioImageSerializer

from .models import PortfolioPageData, PortfolioProject

User = get_user_model()


class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "display_name", "school", "grade", "email")


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "display_name", "email")


class PortfolioPageDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioPageData
        fields = (
            "id",
            "page_id",
            "page_number",
            "part",
            "title_en",
            "title_zh",
            "fields",
            "status",
            "word_count_summary",
            "missing_required_fields",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "page_id",
            "page_number",
            "part",
            "title_en",
            "title_zh",
            "word_count_summary",
            "missing_required_fields",
            "updated_at",
        )


class PortfolioPageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioPageData
        fields = ("fields", "status")


class PortfolioListSerializer(serializers.ModelSerializer):
    owner = OwnerSerializer(read_only=True)
    assigned_teacher = TeacherSerializer(read_only=True)

    class Meta:
        model = PortfolioProject
        fields = (
            "id",
            "owner",
            "assigned_teacher",
            "title",
            "project_name",
            "challenge_category",
            "target_major",
            "mentor_name",
            "program_duration",
            "status",
            "completion_rate",
            "created_at",
            "updated_at",
        )


class PortfolioDetailSerializer(serializers.ModelSerializer):
    owner = OwnerSerializer(read_only=True)
    assigned_teacher = TeacherSerializer(read_only=True)
    pages = PortfolioPageDataSerializer(many=True, read_only=True)
    images = PortfolioImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioProject
        fields = (
            "id",
            "owner",
            "assigned_teacher",
            "title",
            "project_name",
            "challenge_category",
            "target_major",
            "mentor_name",
            "program_duration",
            "status",
            "completion_rate",
            "pages",
            "images",
            "reviews",
            "created_at",
            "updated_at",
        )

    def get_reviews(self, obj):
        from apps.reviews.serializers import PageReviewSerializer

        reviews = PageReview.objects.filter(portfolio=obj)
        return PageReviewSerializer(reviews, many=True).data


class PortfolioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioProject
        fields = (
            "title",
            "project_name",
            "challenge_category",
            "target_major",
            "mentor_name",
            "program_duration",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        portfolio = PortfolioProject.objects.create(owner=user, **validated_data)
        from .services import initialize_portfolio_pages

        initialize_portfolio_pages(portfolio)
        return portfolio
