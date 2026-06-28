from rest_framework import serializers

from .models import PortfolioImage


class PortfolioImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    page_id = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioImage
        fields = (
            "id",
            "url",
            "field_id",
            "page_id",
            "original_filename",
            "file_size",
            "width",
            "height",
            "sort_order",
            "created_at",
        )

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return ""

    def get_page_id(self, obj):
        return obj.page_id
