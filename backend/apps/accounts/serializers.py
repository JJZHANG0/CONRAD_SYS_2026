from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "username", "email", "role", "display_name",
            "school", "grade", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
