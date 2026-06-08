#!/usr/bin/env bash
# Build and restart production stack. Run from project root on the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Installing server dependencies"
cd server && npm ci
echo "==> Building API"
npm run build
npm prune --omit=dev
cd "$ROOT"

echo "==> Installing client dependencies"
cd client && npm ci
echo "==> Building frontend (API served at /api via nginx)"
# Same-origin /api — no VITE_API_URL needed when nginx proxies
npm run build
cd "$ROOT"

echo "==> Restarting PM2 (attendance-api only — other PM2 apps untouched)"
if pm2 describe attendance-api >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Done."
echo "    Nginx: only reload after editing captainbnb.online config:"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo "    Do NOT remove other sites in /etc/nginx/sites-enabled/"
