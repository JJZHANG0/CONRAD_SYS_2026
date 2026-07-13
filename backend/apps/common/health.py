from pathlib import Path

from django.conf import settings
from django.http import JsonResponse


def health(request):
    version_file = Path(settings.BASE_DIR) / "VERSION"
    version = version_file.read_text(encoding="utf-8").strip() if version_file.exists() else "unknown"
    return JsonResponse({"status": "ok", "version": version})
