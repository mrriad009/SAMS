#!/usr/bin/env bash
# Run on VPS before deploy — checks coexistence with other sites. No changes made.
set -euo pipefail

echo "=== Existing nginx sites (do not delete these) ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "nginx sites-enabled not found"

echo ""
echo "=== Port 3003 (must be free) ==="
if sudo ss -tlnp 2>/dev/null | grep -q ':3003 '; then
  echo "WARNING: Port 3003 is already in use:"
  sudo ss -tlnp | grep ':3003 '
  echo "Change PORT in server/.env and ecosystem.config.cjs, then update nginx upstream."
  exit 1
else
  echo "OK — port 3003 is free"
fi

echo ""
echo "=== PM2 apps (attendance-api will be added separately) ==="
pm2 list 2>/dev/null || echo "PM2 not installed or no processes"

echo ""
echo "=== Node listeners (avoid port clashes) ==="
sudo ss -tlnp 2>/dev/null | grep -E 'node|LISTEN' | head -20 || true

echo ""
echo "Preflight complete. Safe to deploy if port 3003 is free and nginx -t passes after adding captainbnb.online config."
