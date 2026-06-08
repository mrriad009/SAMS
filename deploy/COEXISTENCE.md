# Safe deployment alongside existing sites

This app is designed to run on a VPS that **already hosts other websites**. Follow these rules so your other 2 sites are not affected.

## What stays untouched

| Area | This project | Your existing sites |
|------|--------------|---------------------|
| Nginx configs | **Only** adds `sites-available/captainbnb.online` | Other files in `sites-available/` / `sites-enabled/` are **not modified** |
| Web root | `/var/www/captainbnb.online/` only | Their own folders (e.g. `/var/www/site1`) stay as-is |
| PM2 process | New app name: `attendance-api` | Other PM2 apps are **not** stopped or deleted |
| API port | `3003` on `127.0.0.1` only | Does not use 80, 443, or their ports |
| SSL cert | New cert for `captainbnb.online` only | Existing certs for other domains are **not** renewed or replaced |
| DNS | Only `captainbnb.online` A records | Other domains unchanged |

## Do NOT run these on a shared VPS

```bash
# NEVER — removes default site and can break other setups
sudo rm -f /etc/nginx/sites-enabled/default

# NEVER — stops every PM2 app on the server
pm2 delete all
pm2 kill

# NEVER — overwrites another project's folder
cd /var/www/other-site && git pull   # wrong directory

# NEVER — global certbot without -d (can pick wrong vhost)
sudo certbot --nginx    # without -d captainbnb.online
```

## Safe commands only

```bash
# 1. Check port 3003 is free (must print nothing or "not in use")
sudo ss -tlnp | grep ':3003'

# 2. Add ONLY this site config (does not edit other files)
sudo cp deploy/nginx/captainbnb.online.initial.conf /etc/nginx/sites-available/captainbnb.online
sudo ln -sf /etc/nginx/sites-available/captainbnb.online /etc/nginx/sites-enabled/captainbnb.online

# 3. Test ALL nginx configs together before reload
sudo nginx -t

# 4. Reload nginx (not restart) — zero downtime for other sites
sudo systemctl reload nginx

# 5. SSL for THIS domain only
sudo certbot --nginx -d captainbnb.online -d www.captainbnb.online

# 6. PM2 — add or reload ONLY this app
pm2 start ecosystem.config.cjs --env production   # first time
pm2 reload attendance-api --env production          # updates
pm2 save
```

## Before you start (preflight)

Run on the VPS:

```bash
# List existing nginx sites — note your other domains; do not delete them
ls -la /etc/nginx/sites-enabled/

# Confirm nothing else uses port 3003
sudo ss -tlnp | grep ':3003' || echo "Port 3003 is free"

# List existing PM2 apps — attendance-api should not exist yet
pm2 list

# See which ports other Node apps use (avoid clashes)
pm2 list && sudo ss -tlnp | grep node
```

If port **3003** is already taken, change `PORT` in `server/.env` and `ecosystem.config.cjs`, then update the `upstream` port in both nginx configs.

## How nginx keeps sites isolated

Nginx routes by `server_name`. This project only answers:

- `captainbnb.online`
- `www.captainbnb.online`

Traffic to your other domains still goes to their existing `server { ... }` blocks. Adding a new file under `sites-enabled/` does not change behavior for other hostnames.

## Certbot on a multi-site server

Always pass the domain explicitly:

```bash
sudo certbot --nginx -d captainbnb.online -d www.captainbnb.online
```

Certbot will attach the certificate to the vhost that already has `server_name captainbnb.online`. It will **not** remove certificates for your other domains.

## PM2 on a multi-app server

- First deploy: `pm2 start ecosystem.config.cjs --env production`
- Updates: `pm2 reload attendance-api` or `./deploy/deploy.sh`
- `pm2 save` only updates the saved process list; it does not remove other apps

If you already use `pm2 startup`, you do **not** need to run it again.

## Rollback (if something goes wrong)

```bash
# Disable only this site
sudo rm /etc/nginx/sites-enabled/captainbnb.online
sudo nginx -t && sudo systemctl reload nginx

# Stop only this API
pm2 stop attendance-api

# Your other sites and PM2 apps keep running
```
