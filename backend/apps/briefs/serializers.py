from rest_framework import serializers

from apps.common.serializers import SafeTextField, apply_safe_text_fields

from .models import BRIEF_FIELDS, InnovationBrief


class InnovationBriefSerializer(serializers.ModelSerializer):
    completion_count = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = InnovationBrief
        fields = (
            "id", "team",
            *BRIEF_FIELDS,
            "completion_count", "completion_rate",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "team", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        apply_safe_text_fields(self, BRIEF_FIELDS)

    def get_completion_count(self, obj):
        return obj.completion_count()

    def get_completion_rate(self, obj):
        return obj.completion_rate
