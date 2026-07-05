from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "username", "email", "role", "display_name",
            "school", "grade", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ConradTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Accept username OR Chinese display_name for login."""

    def validate(self, attrs):
        login_id = (attrs.get("username") or "").strip()
        password = attrs.get("password")

        UserModel = get_user_model()
        user = UserModel.objects.filter(username=login_id).first()

        if user is None and login_id:
            matches = UserModel.objects.filter(display_name=login_id)
            if matches.count() == 1:
                user = matches.first()
            elif matches.count() > 1:
                raise serializers.ValidationError(
                    {"detail": "Multiple accounts share this name. Please contact your teacher or admin."}
                )

        if user is None or not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "No active account found with the given credentials"}
            )

        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
