import logging

from django.db.utils import DatabaseError
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.common.db import run_with_db_retry

logger = logging.getLogger(__name__)


def save_serialized_form(instance, serializer_class, request_data):
    serializer = serializer_class(instance, data=request_data, partial=True)
    serializer.is_valid(raise_exception=True)

    def persist():
        saved = serializer.save()
        saved.refresh_from_db()
        return serializer_class(saved).data

    return run_with_db_retry(persist)


def get_or_create_serialized(serializer_class, team, factory):
    instance, _ = run_with_db_retry(lambda: factory(team))
    return serializer_class(instance).data


def handle_form_database_errors(action):
    try:
        return action()
    except ValidationError:
        raise
    except DatabaseError as exc:
        logger.warning("Database error in form view: %s", exc)
        return Response(
            {"detail": "Database is busy, please retry in a moment."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as exc:
        logger.exception("Unexpected error in form view", exc_info=exc)
        return Response(
            {"detail": "Server error while saving. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
