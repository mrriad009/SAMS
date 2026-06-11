#!/usr/bin/env bash
# Rebuild and publish frontend only (no API restart). Run on the VPS from project root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/client"

echo "==> Installing client dependencies"
npm ci

echo "==> Building frontend"
npm run build

WEB_ROOT="${WEB_ROOT:-/var/www/captainbnb.online/client/dist}"
echo "==> Publishing to ${WEB_ROOT}"
mkdir -p "$(dirname "$WEB_ROOT")"
rm -rf "$WEB_ROOT"
cp -R dist "$WEB_ROOT"

echo "==> Done. Hard-refresh https://captainbnb.online/login (Cmd+Shift+R)."
