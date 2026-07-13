import time

from django.db.backends.signals import connection_created
from django.db.utils import OperationalError


def configure_sqlite(sender, connection, **kwargs):
    if connection.vendor != "sqlite":
        return
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=30000;")


connection_created.connect(configure_sqlite)


def run_with_db_retry(action, retries=5, base_delay=0.15):
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
