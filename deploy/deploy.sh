#!/usr/bin/env bash
# One-click deploy on Alibaba Cloud ECS (Ubuntu / Alibaba Linux / CentOS)
set -euo pipefail

APP_DIR="/opt/conrad_sys"
REPO_URL="${REPO_URL:-https://github.com/JJZHANG0/CONRAD_SYS_2026.git}"
SERVER_IP="${SERVER_IP:-39.102.56.62}"
PIP_INDEX="${PIP_INDEX:-https://pypi.tuna.tsinghua.edu.cn/simple}"

python_ok() {
  "$1" -c 'import sys; exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null
}

find_python() {
  for cmd in python3.12 python3.11 python3.10 python3; do
    if command -v "$cmd" >/dev/null && python_ok "$cmd"; then
      echo "$cmd"
      return 0
    fi
  done
  return 1
}

install_python_packages() {
  if command -v apt-get >/dev/null; then
    apt-get update -qq
    apt-get install -y -qq git nginx curl \
      python3 python3-venv python3-pip python3-dev build-essential \
      libjpeg-dev zlib1g-dev libffi-dev
    if ! command -v node >/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y -qq nodejs
    fi
    apt-get install -y -qq python3.11 python3.11-venv python3.11-dev 2>/dev/null || true
  elif command -v dnf >/dev/null; then
    dnf install -y git nginx curl gcc gcc-c++ make \
      openssl-devel bzip2-devel libffi-devel zlib-devel readline-devel sqlite-devel xz-devel \
      libjpeg-turbo-devel
    dnf install -y python3.11 python3.11-pip python3.11-devel 2>/dev/null || \
      dnf install -y python3.12 python3.12-pip python3.12-devel 2>/dev/null || true
    if ! command -v node >/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      dnf install -y nodejs
    fi
  elif command -v yum >/dev/null; then
    yum install -y git nginx curl gcc gcc-c++ make \
      openssl-devel bzip2-devel libffi-devel zlib-devel readline-devel sqlite-devel xz-devel \
      libjpeg-turbo-devel wget
    yum install -y python3.11 python3.11-pip python3.11-devel 2>/dev/null || \
      yum install -y python311 python311-pip python311-devel 2>/dev/null || true
    if ! command -v node >/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      yum install -y nodejs
    fi
  fi
}

install_python_from_source() {
  local ver="3.12.7"
  local prefix="/usr/local"
  echo "==> Building Python ${ver} from source (system Python is too old)..."
  cd /usr/src
  if [ ! -f "Python-${ver}.tgz" ]; then
    curl -fsSLO "https://www.python.org/ftp/python/${ver}/Python-${ver}.tgz"
  fi
  tar xzf "Python-${ver}.tgz"
  cd "Python-${ver}"
  ./configure --prefix="${prefix}" --enable-optimizations
  make -j"$(nproc 2>/dev/null || echo 2)"
  make altinstall
  echo "${prefix}/bin/python3.12"
}

ensure_python() {
  local py
  if py="$(find_python)"; then
    echo "$py"
    return 0
  fi
  install_python_from_source
}

echo "==> Installing system packages..."
install_python_packages

PYTHON_BIN="$(ensure_python)"
echo "==> Using Python: $PYTHON_BIN ($($PYTHON_BIN --version))"

echo "==> Cloning / updating code..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Backend setup..."
cd "$APP_DIR/backend"
rm -rf venv
"$PYTHON_BIN" -m venv venv
source venv/bin/activate
pip install -q -U pip setuptools wheel
pip install -q -r requirements.txt -i "$PIP_INDEX"

if [ ! -f .env ]; then
  cp .env.example .env
  SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(48))")
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
# Disable default server block if it conflicts
if [ -f /etc/nginx/nginx.conf ] && grep -q 'listen.*80' /etc/nginx/nginx.conf; then
  sed -i 's/^\(\s*listen\s.*80.*;\)/# \1/' /etc/nginx/nginx.conf 2>/dev/null || true
fi
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
