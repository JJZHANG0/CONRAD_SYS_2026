from rest_framework import serializers

from .models import BRIEF_FIELDS, InnovationBrief


class InnovationBriefSerializer(serializers.ModelSerializer):
    completion_count = serializers.SerializerMethodField()
    completion_rate = serializers.FloatField(read_only=True)

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
