#!/usr/bin/env bash
# Finish deployment after manual backend/frontend setup (no git pull needed)
set -euo pipefail

APP_DIR="/opt/conrad_sys"
SERVER_IP="${SERVER_IP:-39.102.56.62}"

echo "==> Checking env files..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
  cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
  SECRET=$(python3.11 -c "import secrets; print(secrets.token_urlsafe(48))")
  sed -i "s|change-me-to-a-long-random-string|$SECRET|" "$APP_DIR/backend/.env"
fi

if [ ! -f "$APP_DIR/frontend/.env.production" ]; then
  cp "$APP_DIR/frontend/.env.production.example" "$APP_DIR/frontend/.env.production"
fi

echo "==> Backend migrate + static..."
cd "$APP_DIR/backend"
source venv/bin/activate
pip install -q gunicorn pysqlite3-binary -i https://pypi.tuna.tsinghua.edu.cn/simple

BACKEND_WAS_ACTIVE=0
if systemctl is-active --quiet conrad-backend 2>/dev/null; then
  BACKEND_WAS_ACTIVE=1
  systemctl stop conrad-backend
fi
restore_backend_on_error() {
  if [ "$BACKEND_WAS_ACTIVE" = "1" ]; then
    systemctl start conrad-backend || true
  fi
}
trap restore_backend_on_error ERR

if [ -f db.sqlite3 ]; then
  BACKUP_DIR="$APP_DIR/backups/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp -p db.sqlite3 "$BACKUP_DIR/db.sqlite3"
  [ ! -f db.sqlite3-wal ] || cp -p db.sqlite3-wal "$BACKUP_DIR/db.sqlite3-wal"
  [ ! -f db.sqlite3-shm ] || cp -p db.sqlite3-shm "$BACKUP_DIR/db.sqlite3-shm"
  echo "==> Database backup: $BACKUP_DIR"
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

echo "==> Frontend build (with production API URL)..."
cd "$APP_DIR/frontend"
npm run build

echo "==> Installing systemd + nginx..."
cp "$APP_DIR/deploy/conrad-backend.service" /etc/systemd/system/
cp "$APP_DIR/deploy/conrad-frontend.service" /etc/systemd/system/
cp "$APP_DIR/deploy/nginx.conrad.conf" /etc/nginx/conf.d/conrad.conf

# Reduce workers for 2GB RAM server
sed -i 's/--workers 2/--workers 1/' /etc/systemd/system/conrad-backend.service

systemctl daemon-reload
systemctl enable conrad-backend conrad-frontend nginx
systemctl restart conrad-backend conrad-frontend nginx
trap - ERR

echo ""
echo "==> Service status:"
systemctl is-active conrad-backend conrad-frontend nginx || true
echo ""
echo "==> Listening ports:"
ss -tlnp | grep -E ':80|:3000|:8000' || true
echo ""
echo "Done! Visit: http://${SERVER_IP}"
echo "If 502 persists, run: journalctl -u conrad-backend -n 30 --no-pager"
echo "                   journalctl -u conrad-frontend -n 30 --no-pager"
