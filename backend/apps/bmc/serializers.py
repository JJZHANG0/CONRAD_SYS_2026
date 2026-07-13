from rest_framework import serializers

from apps.common.serializers import apply_safe_text_fields
from apps.common.text import sanitize_rich_text_html

from .models import BMC_FIELDS, LeanCanvas


class LeanCanvasSerializer(serializers.ModelSerializer):
    completion_count = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = LeanCanvas
        fields = (
            "id",
            "team",
            *BMC_FIELDS,
            "completion_count",
            "completion_rate",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "team", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        apply_safe_text_fields(self, BMC_FIELDS)

    def get_completion_count(self, obj):
        return obj.completion_count()

    def get_completion_rate(self, obj):
        return obj.completion_rate

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in BMC_FIELDS:
            data[field] = sanitize_rich_text_html(data.get(field) or "")
        return data
