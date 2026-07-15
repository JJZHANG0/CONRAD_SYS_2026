import logging
import time

from django.db.backends.signals import connection_created
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)


def configure_sqlite(sender, connection, **kwargs):
    if connection.vendor != "sqlite":
        return
    try:
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA journal_mode=WAL;")
            journal_mode = cursor.fetchone()
            cursor.execute("PRAGMA synchronous=NORMAL;")
            cursor.execute("PRAGMA busy_timeout=30000;")
            mode = str(journal_mode[0]).lower() if journal_mode else "unknown"
            # In-memory SQLite databases (Django tests) only support "memory".
            if mode not in {"wal", "memory"}:
                logger.warning("SQLite WAL was requested but mode is %s", journal_mode)
    except Exception as exc:
        logger.warning("Failed to configure SQLite WAL/busy timeout: %s", exc)


connection_created.connect(configure_sqlite)


def run_with_db_retry(action, retries=10, base_delay=0.25):
    last_error = None
    for attempt in range(retries):
        try:
            return action()
        except OperationalError as exc:
            last_error = exc
            message = str(exc).lower()
            if "locked" not in message and "busy" not in message:
                raise
            if attempt == retries - 1:
                raise
            time.sleep(base_delay * (attempt + 1))
    if last_error:
        raise last_error
