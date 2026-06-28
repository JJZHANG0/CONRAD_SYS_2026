#!/usr/bin/env bash
# One-click deploy on Alibaba Cloud ECS (Ubuntu/CentOS with root)
set -euo pipefail

APP_DIR="/opt/conrad_sys"
REPO_URL="${REPO_URL:-https://github.com/JJZHANG0/CONRAD_SYS_2026.git}"
SERVER_IP="${SERVER_IP:-39.102.56.62}"

echo "==> Installing system packages..."
if command -v apt-get >/dev/null; then
  apt-get update -qq
  apt-get install -y -qq git nginx python3 python3-venv python3-pip curl
  if ! command -v node >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
  fi
elif command -v yum >/dev/null; then
  yum install -y git nginx python3 python3-pip curl
  if ! command -v node >/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
  fi
fi

echo "==> Cloning / updating code..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Backend setup..."
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
  sed -i "s|change-me-to-a-long-random-string|$SECRET|" .env
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

echo "==> Frontend setup..."
cd "$APP_DIR/frontend"
npm ci
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
fi
npm run build

echo "==> Installing systemd services..."
cp "$APP_DIR/deploy/conrad-backend.service" /etc/systemd/system/
cp "$APP_DIR/deploy/conrad-frontend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable conrad-backend conrad-frontend nginx
systemctl restart conrad-backend conrad-frontend

echo "==> Configuring nginx..."
cp "$APP_DIR/deploy/nginx.conrad.conf" /etc/nginx/conf.d/conrad.conf
nginx -t
systemctl restart nginx

echo "==> Opening firewall (if firewalld)..."
if command -v firewall-cmd >/dev/null; then
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --reload || true
fi

echo ""
echo "Deploy complete! Visit: http://${SERVER_IP}"
echo "Create admin: cd $APP_DIR/backend && source venv/bin/activate && python manage.py createsuperuser"
