#!/usr/bin/env bash
# One-shot VPS update: pull latest main, build, publish the site, reload the API.
# Run on the server:  bash ~/SAMS/update.sh
# Leaves .env, uploads, and other gitignored files in place.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

WEB_ROOT="${WEB_ROOT:-/var/www/samsbd.online/client/dist}"
BRANCH="${BRANCH:-main}"

echo "==> Pulling origin/${BRANCH}"
git fetch origin
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "    Stashing local edits so pull can finish"
  git stash push -m "vps-update $(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi
git pull --ff-only origin "$BRANCH"

echo "==> Installing and building API"
cd "$ROOT/server"
npm ci
npm run build
cd "$ROOT"

echo "==> Installing and building frontend"
cd "$ROOT/client"
npm ci
npm run build
cd "$ROOT"

echo "==> Publishing frontend to ${WEB_ROOT}"
mkdir -p "$(dirname "$WEB_ROOT")"
rm -rf "$WEB_ROOT"
cp -R "$ROOT/client/dist" "$WEB_ROOT"

echo "==> Reloading attendance-api"
if pm2 describe attendance-api >/dev/null 2>&1; then
  pm2 reload attendance-api --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Updated $(git rev-parse --short HEAD) on https://samsbd.online"
