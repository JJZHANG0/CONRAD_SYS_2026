from rest_framework import serializers

from apps.common.review_status import normalize_field_reviews
from apps.common.serializers import apply_safe_text_fields
from apps.common.text import sanitize_rich_text_html

from .models import BRIEF_FIELDS, InnovationBrief


class InnovationBriefSerializer(serializers.ModelSerializer):
    completion_count = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = InnovationBrief
        fields = (
            "id", "team",
            *BRIEF_FIELDS,
            "field_reviews",
            "completion_count", "completion_rate",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "team", "field_reviews", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        apply_safe_text_fields(self, BRIEF_FIELDS)

    def get_completion_count(self, obj):
        return obj.completion_count()

    def get_completion_rate(self, obj):
        return obj.completion_rate

    def update(self, instance, validated_data):
        changed_fields = []
        for field, value in validated_data.items():
            if field in BRIEF_FIELDS:
                setattr(instance, field, value)
                changed_fields.append(field)
        if changed_fields:
            # Partial column update prevents simultaneous edits to different
            # Brief modules from overwriting each other.
            instance.save(update_fields=[*changed_fields, "updated_at"])
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in BRIEF_FIELDS:
            data[field] = sanitize_rich_text_html(data.get(field) or "")
        data["field_reviews"] = normalize_field_reviews(
            data.get("field_reviews") or {}, BRIEF_FIELDS
        )
        return data
