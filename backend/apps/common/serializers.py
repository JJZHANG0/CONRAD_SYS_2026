from rest_framework import serializers

from apps.common.text import clean_rich_text


class SafeTextField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_blank", True)
        kwargs.setdefault("allow_null", False)
        super().__init__(**kwargs)

    def validate_empty_values(self, data):
        if data is None:
            return True, ""
        return super().validate_empty_values(data)

    def to_internal_value(self, data):
        if data is None:
            return ""
        value = super().to_internal_value(data)
        return clean_rich_text(value)


def apply_safe_text_fields(serializer, field_names):
    for name in field_names:
        serializer.fields[name] = SafeTextField()
