#!/usr/bin/env bash
# Quick backend hotfix on production server (run as root on 39.102.56.62)
set -euo pipefail

APP_DIR="/opt/conrad_sys"
cd "$APP_DIR"

echo "==> Pull latest code..."
git pull https://ghfast.top/https://github.com/JJZHANG0/CONRAD_SYS_2026.git main

cd backend
source venv/bin/activate

echo "==> Stop backend + back up SQLite..."
systemctl stop conrad-backend
restart_backend() {
  systemctl start conrad-backend || true
}
trap restart_backend EXIT

if [ -f db.sqlite3 ]; then
  BACKUP_DIR="$APP_DIR/backups/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp -p db.sqlite3 "$BACKUP_DIR/db.sqlite3"
  [ ! -f db.sqlite3-wal ] || cp -p db.sqlite3-wal "$BACKUP_DIR/db.sqlite3-wal"
  [ ! -f db.sqlite3-shm ] || cp -p db.sqlite3-shm "$BACKUP_DIR/db.sqlite3-shm"
  echo "    backup: $BACKUP_DIR"
fi

echo "==> Migrate + repair text fields (writes are paused)..."
python manage.py migrate --noinput
python manage.py repair_form_text_fields
python manage.py clean_rich_text_fields

echo "==> Restart backend..."
cp "$APP_DIR/deploy/conrad-backend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl restart conrad-backend
trap - EXIT
sleep 2

echo "==> Health check..."
curl -s "http://127.0.0.1:8000/api/health/" || true
echo ""

cd ../frontend
echo "==> Rebuild frontend (clean)..."
systemctl stop conrad-frontend || true
rm -rf .next
npm run build
cp "$APP_DIR/deploy/nginx.conrad.conf" /etc/nginx/conf.d/conrad.conf
nginx -t && systemctl reload nginx
systemctl start conrad-frontend

echo "Done. Open http://39.102.56.62/api/health/ — version should NOT be 'unknown'."
