#!/usr/bin/env bash
# Quick backend hotfix on production server (run as root on 39.102.56.62)
set -euo pipefail

APP_DIR="/opt/conrad_sys"
cd "$APP_DIR"

echo "==> Pull latest code..."
git pull https://ghfast.top/https://github.com/JJZHANG0/CONRAD_SYS_2026.git main

cd backend
source venv/bin/activate

echo "==> Migrate + repair NULL text fields..."
python manage.py migrate --noinput
python manage.py repair_form_text_fields

echo "==> Restart backend..."
systemctl restart conrad-backend
sleep 2

echo "==> Health check..."
curl -s "http://127.0.0.1:8000/api/health/" || true
echo ""

cd ../frontend
echo "==> Rebuild frontend..."
npm run build
systemctl restart conrad-frontend

echo "Done. Open http://39.102.56.62/api/health/ — version should NOT be 'unknown'."
