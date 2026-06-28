#!/usr/bin/env bash
# Sync frontend fix to ECS (server has no rsync — use scp + tar)
set -euo pipefail

SERVER="${1:-root@39.102.56.62}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Packaging frontend files..."
TMP="$(mktemp /tmp/conrad-fe.XXXXXX.tgz)"
tar -czf "$TMP" -C "$ROOT" \
  frontend/components \
  frontend/types/log.ts

echo "==> Uploading to $SERVER ..."
scp "$TMP" "$SERVER:/tmp/conrad-fe.tgz"

echo "==> Extracting and rebuilding on server..."
ssh "$SERVER" 'set -e
  cd /opt/conrad_sys
  tar -xzf /tmp/conrad-fe.tgz
  cd frontend
  npm run build
  systemctl restart conrad-frontend
  echo "Done! Hard-refresh http://39.102.56.62"
'

rm -f "$TMP"
