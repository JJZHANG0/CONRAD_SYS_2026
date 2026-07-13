from rest_framework import serializers

from apps.common.text import clean_rich_text

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

    def get_completion_count(self, obj):
        return obj.completion_count()

    def get_completion_rate(self, obj):
        return obj.completion_rate

    def validate(self, attrs):
        for field in BRIEF_FIELDS:
            if field in attrs:
                attrs[field] = clean_rich_text(attrs[field])
        return attrs
