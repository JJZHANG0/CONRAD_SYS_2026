import html
import re

from django.utils import timezone
from rest_framework import serializers

from apps.common.serializers import apply_safe_text_fields
from apps.common.text import sanitize_rich_text_html

from .models import DailyLog

STUDENT_FIELDS = ("work_content", "task_completion", "problems_solutions", "reflection")
TEACHER_FIELDS = ("teacher_comment",)
MIN_STUDENT_LOG_CHARS = 100
_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def plain_text_length(value):
    text = _TAG_RE.sub(" ", value or "")
    text = html.unescape(text)
    return len(_WHITESPACE_RE.sub(" ", text).strip())


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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in (*STUDENT_FIELDS, *TEACHER_FIELDS):
            data[field] = sanitize_rich_text_html(data.get(field) or "")
        return data


class StudentLogUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = STUDENT_FIELDS

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        apply_safe_text_fields(self, STUDENT_FIELDS)

    def validate(self, attrs):
        errors = {}
        for field, value in attrs.items():
            if field not in STUDENT_FIELDS:
                continue
            current_count = plain_text_length(value)
            original = getattr(self.instance, field, "") if self.instance else ""
            unchanged_existing = (
                plain_text_length(original) > 0
                and sanitize_rich_text_html(value)
                == sanitize_rich_text_html(original)
            )
            if current_count < MIN_STUDENT_LOG_CHARS and not unchanged_existing:
                errors[field] = (
                    f"不行～今天还学得不够多，需要至少写 "
                    f"{MIN_STUDENT_LOG_CHARS} 字（当前 {current_count} 字）。"
                )
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def update(self, instance, validated_data):
        changed_fields = []
        for field, value in validated_data.items():
            setattr(instance, field, value)
            changed_fields.append(field)
        if changed_fields:
            # Update only student columns so a simultaneous teacher save cannot
            # be overwritten by a stale model instance.
            instance.save(update_fields=[*changed_fields, "updated_at"])
        return instance


class TeacherCommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = TEACHER_FIELDS

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        apply_safe_text_fields(self, TEACHER_FIELDS)

    def update(self, instance, validated_data):
        instance.teacher_comment = validated_data.get(
            "teacher_comment", instance.teacher_comment or ""
        )
        instance.teacher_comment_updated_at = timezone.now()
        # Do not rewrite student fields from a stale instance.
        instance.save(
            update_fields=[
                "teacher_comment",
                "teacher_comment_updated_at",
                "updated_at",
            ]
        )
        return instance
