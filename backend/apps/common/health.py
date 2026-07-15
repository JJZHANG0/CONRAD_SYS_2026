from pathlib import Path

from django.conf import settings
from django.db import connection
from django.http import JsonResponse


def health(request):
    version_file = Path(settings.BASE_DIR) / "VERSION"
    version = version_file.read_text(encoding="utf-8").strip() if version_file.exists() else "unknown"
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
            journal_mode = None
            if connection.vendor == "sqlite":
                cursor.execute("PRAGMA journal_mode;")
                row = cursor.fetchone()
                journal_mode = row[0] if row else None
    except Exception:
        return JsonResponse(
            {"status": "error", "version": version, "database": "unavailable"},
            status=503,
        )

    payload = {
        "status": "ok",
        "version": version,
        "database": connection.vendor,
    }
    if journal_mode:
        payload["journal_mode"] = journal_mode
    return JsonResponse(payload)
