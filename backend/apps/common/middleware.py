import logging

from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class ApiJsonExceptionMiddleware:
    """Return JSON (not HTML) for unhandled /api/ errors."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if not request.path.startswith("/api/"):
            return None
        logger.exception("Unhandled API error on %s %s", request.method, request.path, exc_info=exception)
        detail = "Internal server error."
        if settings.DEBUG:
            detail = f"{type(exception).__name__}: {exception}"
        return JsonResponse({"detail": detail}, status=500)
