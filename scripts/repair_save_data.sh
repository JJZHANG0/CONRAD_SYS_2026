#!/usr/bin/env bash
# Safely audit and clean legacy rich-text/NULL data while writes are stopped.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/conrad_sys}"
BACKEND_DIR="$APP_DIR/backend"
SERVICE="${BACKEND_SERVICE:-conrad-backend}"
DB_FILE="$BACKEND_DIR/db.sqlite3"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$BACKEND_DIR/manage.py" ]; then
  echo "Backend not found at $BACKEND_DIR"
  exit 1
fi

restart_backend() {
  systemctl start "$SERVICE"
}
trap restart_backend EXIT

echo "Stopping backend to prevent cleanup/write races..."
systemctl stop "$SERVICE"

if [ -f "$DB_FILE" ]; then
  BACKUP="$BACKEND_DIR/db.sqlite3.backup-$STAMP"
  cp -p "$DB_FILE" "$BACKUP"
  echo "SQLite backup: $BACKUP"
fi

cd "$BACKEND_DIR"
source venv/bin/activate

echo "Auditing dirty rows..."
python manage.py clean_rich_text_fields --dry-run

echo "Cleaning dirty rows..."
python manage.py clean_rich_text_fields

echo "Verifying Django configuration..."
python manage.py check

trap - EXIT
restart_backend
echo "Cleanup complete; backend restarted."
