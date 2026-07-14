"""Shared field review helpers for BMC / Innovation Brief."""

from __future__ import annotations

REVIEW_PASS = "pass"
REVIEW_FAIL = "fail"
VALID_STATUSES = {REVIEW_PASS, REVIEW_FAIL}


def normalize_field_reviews(raw, allowed_fields: list[str]) -> dict:
    """Keep only allowed field ids with pass/fail values."""
    if not isinstance(raw, dict):
        return {}
    allowed = set(allowed_fields)
    cleaned: dict[str, str] = {}
    for key, value in raw.items():
        if key not in allowed:
            continue
        if value in (None, "", "none", "clear"):
            continue
        if value in VALID_STATUSES:
            cleaned[key] = value
    return cleaned


def merge_field_review(existing, field: str, status, allowed_fields: list[str]) -> dict:
    current = normalize_field_reviews(existing or {}, allowed_fields)
    if field not in allowed_fields:
        raise ValueError(f"Invalid field: {field}")
    if status in (None, "", "none", "clear"):
        current.pop(field, None)
    elif status in VALID_STATUSES:
        current[field] = status
    else:
        raise ValueError("status must be pass, fail, or clear")
    return current
