from rest_framework import serializers

from .models import BMC_FIELDS, LeanCanvas


class LeanCanvasSerializer(serializers.ModelSerializer):
    completion_count = serializers.SerializerMethodField()
    completion_rate = serializers.FloatField(read_only=True)

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

    def get_completion_count(self, obj):
        return obj.completion_count()
