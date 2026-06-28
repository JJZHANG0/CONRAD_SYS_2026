from django.utils import timezone
from rest_framework import serializers

from .models import DailyLog

STUDENT_FIELDS = ("work_content", "task_completion", "problems_solutions", "reflection")
TEACHER_FIELDS = ("teacher_comment",)


class DailyLogSerializer(serializers.ModelSerializer):
    is_complete = serializers.BooleanField(read_only=True)
    has_teacher_comment = serializers.BooleanField(read_only=True)

    class Meta:
        model = DailyLog
        fields = (
            "id", "team", "student", "day",
            "work_content", "task_completion", "problems_solutions", "reflection",
            "teacher_comment", "teacher_comment_updated_at",
            "is_complete", "has_teacher_comment",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "team", "student", "day", "teacher_comment_updated_at", "created_at", "updated_at")


class StudentLogUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = STUDENT_FIELDS


class TeacherCommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = TEACHER_FIELDS

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.teacher_comment_updated_at = timezone.now()
        instance.save(update_fields=["teacher_comment", "teacher_comment_updated_at", "updated_at"])
        return instance
