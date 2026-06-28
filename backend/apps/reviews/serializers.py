from rest_framework import serializers

from .models import PageReview


class PageReviewSerializer(serializers.ModelSerializer):
    page_id = serializers.CharField(source="page_data.page_id", read_only=True)
    reviewer_name = serializers.CharField(source="reviewer.display_name", read_only=True)

    class Meta:
        model = PageReview
        fields = (
            "id",
            "page_id",
            "status",
            "overall_comment",
            "content_suggestion",
            "application_suggestion",
            "reviewer_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "page_id", "reviewer_name", "created_at", "updated_at")


class PageReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageReview
        fields = (
            "status",
            "overall_comment",
            "content_suggestion",
            "application_suggestion",
        )
