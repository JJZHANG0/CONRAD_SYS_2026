#!/usr/bin/env bash
# Deploy NEW Conrad Team Command Center alongside existing services.
# NEVER touches existing /var/www or older Conrad apps.
# Usage (on server): bash remote_setup.sh
set -euo pipefail

APP_DIR=/opt/conrad-team-ops
REPO=https://github.com/JJZHANG0/CONRAD_SYS_2026.git
BRANCH=${1:-command-center}
BACKEND_PORT=8010
FRONTEND_PORT=3010

echo "==> Safe deploy of branch '$BRANCH'"
echo "    App dir: $APP_DIR (new, does not overwrite old sites)"
echo "    Ports: frontend=$FRONTEND_PORT backend=$BACKEND_PORT"

mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

if ! command -v python3 >/dev/null; then
  dnf install -y python3 python3-pip || yum install -y python3 python3-pip
fi
if ! command -v node >/dev/null; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs || yum install -y nodejs
fi
if ! command -v npm >/dev/null; then
  echo "npm missing"; exit 1
fi

# Backend on 8010
cd "$APP_DIR/backend"
python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
TEAM_COUNT=$(python -c "import django,os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings'); django.setup(); from teams.models import Team; print(Team.objects.count())")
if [ "$TEAM_COUNT" = "0" ] && [ -f data_fixture.json ]; then
  python manage.py loaddata data_fixture.json || true
fi

# Frontend on 3010
cd "$APP_DIR/frontend"
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://39.102.56.62:${BACKEND_PORT}/api
EOF
npm install
npm run build

# Dedicated systemd units — names do not collide with old services
cat >/etc/systemd/system/conrad-team-ops-backend.service <<EOF
[Unit]
Description=Conrad Team Ops Backend (new, port ${BACKEND_PORT})
After=network.target

[Service]
WorkingDirectory=${APP_DIR}/backend
ExecStart=${APP_DIR}/backend/venv/bin/python manage.py runserver 0.0.0.0:${BACKEND_PORT}
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

cat >/etc/systemd/system/conrad-team-ops-frontend.service <<EOF
[Unit]
Description=Conrad Team Ops Frontend (new, port ${FRONTEND_PORT})
After=network.target conrad-team-ops-backend.service

[Service]
WorkingDirectory=${APP_DIR}/frontend
Environment=NODE_ENV=production
Environment=PORT=${FRONTEND_PORT}
ExecStart=/usr/bin/npm start -- -p ${FRONTEND_PORT}
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable conrad-team-ops-backend conrad-team-ops-frontend
systemctl restart conrad-team-ops-backend
systemctl restart conrad-team-ops-frontend
systemctl --no-pager --full status conrad-team-ops-backend conrad-team-ops-frontend || true

echo ""
echo "==> Deployed WITHOUT touching old Conrad code."
echo "    Frontend: http://39.102.56.62:${FRONTEND_PORT}"
echo "    Backend:  http://39.102.56.62:${BACKEND_PORT}"
echo "    Code:     ${APP_DIR} (branch ${BRANCH})"
