#!/usr/bin/env bash
# Clean rebuild Next.js frontend on production (fixes 404 on _next/static/chunks/*.js)
set -euo pipefail

APP_DIR="/opt/conrad_sys"
cd "$APP_DIR/frontend"

echo "==> Stopping frontend..."
systemctl stop conrad-frontend || true

echo "==> Clean old build..."
rm -rf .next

echo "==> Building frontend..."
npm run build

echo "==> Updating nginx static config..."
cp "$APP_DIR/deploy/nginx.conrad.conf" /etc/nginx/conf.d/conrad.conf
nginx -t
systemctl reload nginx

echo "==> Starting frontend..."
systemctl start conrad-frontend
sleep 2

echo "==> Smoke test..."
curl -s -o /dev/null -w "homepage %{http_code}\n" "http://127.0.0.1:3000/"
CHUNK=$(ls .next/static/chunks/webpack-*.js | head -1 | xargs basename)
curl -s -o /dev/null -w "webpack chunk %{http_code}\n" "http://39.102.56.62/_next/static/chunks/$CHUNK"

echo "Done. Hard-refresh browser (Cmd+Shift+R) before testing."
