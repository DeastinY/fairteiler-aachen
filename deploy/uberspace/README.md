# Deploying to Uberspace 8 (chosen host: nix.uberspace.de)

Uberspace 8 is Arch-Linux-based (VMs): systemd **user** services, web
backends via Caddy/Apache, static DocumentRoot at
`/var/www/virtual/<user>/html` (symlinked as `~/www`). Layout: same origin —
Apache serves the built frontend from `~/www`; `/api/*` routes to uvicorn on
port 8000 (which must bind `0.0.0.0` on U8).

## One-time setup

1. **Account**: SSH key added in the dashboard (Logins → SSH keys).
   Host `<user>@nix.uberspace.de`; site `https://<user>.uber.space`
   (custom domain later: `uberspace web domain add fairteiler-aachen.de`).

2. **On the server** (`ssh <user>@nix.uberspace.de`):

   ```bash
   # code + venv (Arch ships a current python3)
   git clone https://github.com/DeastinY/fairteiler-aachen.git ~/fairteiler-repo
   python3 -m venv ~/fairteiler/venv
   ~/fairteiler/venv/bin/pip install -r ~/fairteiler-repo/backend/requirements.txt
   mkdir -p ~/fairteiler/data

   # environment (never in git)
   cp ~/fairteiler-repo/deploy/env.example ~/fairteiler/env
   ~/fairteiler/venv/bin/python ~/fairteiler-repo/scripts/generate_vapid.py
   # -> paste the three VAPID lines into ~/fairteiler/env, set:
   #    FAIRTEILER_DB=sqlite:////home/<user>/fairteiler/data/fairteiler.db
   #    DEVICE_SALT=<long random string>   (CORS_ORIGINS stays unset: same origin)
   chmod 600 ~/fairteiler/env

   # systemd user service
   mkdir -p ~/.config/systemd/user
   cp ~/fairteiler-repo/deploy/uberspace/fairteiler-api.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable --now fairteiler-api
   systemctl --user status fairteiler-api      # logs: journalctl --user -u fairteiler-api

   # route /api to the service; everything else stays static from ~/www
   uberspace web backend add /api port 8000
   uberspace web backend list

   # SPA fallback for the frontend routes
   cp ~/fairteiler-repo/deploy/uberspace/htaccess ~/www/.htaccess

   # nightly DB backup 03:15 + retention cleanup 03:45 (Datenschutz §9: 90 Tage)
   (crontab -l 2>/dev/null; \
    echo "15 3 * * * ~/fairteiler-repo/deploy/uberspace/backup.sh"; \
    echo "45 3 * * * cd ~/fairteiler-repo/backend && set -a && . ~/fairteiler/env && ~/fairteiler/venv/bin/python manage.py prune") | crontab -
   ```

   Moderation (as promised in the Impressum): `manage.py reports` lists
   recent reports, `manage.py delete-report <id>` removes one,
   `manage.py block <device_hash>` stops a spamming device.

3. **First frontend upload** (from your machine, repo root):

   ```bash
   UBERSPACE=<user>@nix.uberspace.de deploy/uberspace/deploy.sh
   ```

4. Check `https://<user>.uber.space` — app loads, `/api/health` ok,
   Aktivität shows the push toggles (config enabled).

## Every later deploy

```bash
UBERSPACE=<user>@nix.uberspace.de deploy/uberspace/deploy.sh
```

(builds the frontend locally with tests, rsyncs to `~/www`, updates the
repo on the server, installs backend deps, restarts the service.)

## Before flipping it public

- Fill every `[PLACEHOLDER]` in the Impressum/Datenschutz views.
- Conclude the AV-Vertrag (Auftragsverarbeitung) with Uberspace — the
  Datenschutzerklärung already states it exists.
- Uberspace keeps no per-user Apache access logs by default; don't enable
  them (matches the Datenschutzerklärung).
