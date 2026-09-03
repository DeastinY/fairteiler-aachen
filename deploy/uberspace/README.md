# Deploying to Uberspace (chosen host)

Layout: same origin. Apache serves the built frontend from `~/html`;
`/api/*` is routed to uvicorn on port 8000. SQLite lives in
`~/fairteiler/data/`. Everything below assumes Uberspace 7.

## One-time setup

1. **Account**: register at https://uberspace.de (first month free, then
   choose your price ≥ €1). Add your SSH key in the dashboard.
   Your host is `<user>@<star>.uberspace.de`; the site is
   `https://<user>.uber.space` (custom domain later via
   `uberspace web domain add fairteiler-aachen.de`).

2. **On the server** (`ssh <user>@<star>.uberspace.de`):

   ```bash
   # Python for the API
   uberspace tools version use python 3.12

   # code + venv
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

   # supervisord service
   cp ~/fairteiler-repo/deploy/uberspace/fairteiler.ini ~/etc/services.d/
   #   edit it: replace <user> with your username
   supervisorctl reread && supervisorctl update && supervisorctl status

   # route /api to the service; everything else stays static from ~/html
   uberspace web backend set /api --http --port 8000
   uberspace web backend list

   # SPA fallback for the frontend routes
   cp ~/fairteiler-repo/deploy/uberspace/htaccess ~/html/.htaccess

   # nightly DB backup at 03:15 (kept 14 days in ~/fairteiler/backups)
   # + nightly retention cleanup at 03:45 (Datenschutz §9: Meldungen > 90 Tage)
   (crontab -l 2>/dev/null; \
    echo "15 3 * * * ~/fairteiler-repo/deploy/uberspace/backup.sh"; \
    echo "45 3 * * * cd ~/fairteiler-repo/backend && set -a && . ~/fairteiler/env && ~/fairteiler/venv/bin/python manage.py prune") | crontab -
   ```

   Moderation (as promised in the Impressum): `manage.py reports` lists
   recent reports, `manage.py delete-report <id>` removes one,
   `manage.py block <device_hash>` stops a spamming device.

3. **First frontend upload** (from your machine, repo root):

   ```bash
   UBERSPACE=<user>@<star>.uberspace.de deploy/uberspace/deploy.sh
   ```

4. Check `https://<user>.uber.space` — app loads, `/api/health` says ok,
   Aktivität shows the push toggles (config enabled).

## Every later deploy

```bash
UBERSPACE=<user>@<star>.uberspace.de deploy/uberspace/deploy.sh
```

(builds the frontend locally, rsyncs it to `~/html`, updates the repo on
the server, installs backend deps, restarts the service.)

## Before flipping it public

- Fill every `[PLACEHOLDER]` in the Impressum/Datenschutz views
  (frontend/src/views/ImpressumView.vue, DatenschutzView.vue — sourced
  from docs/legal/).
- Decide the report retention period (Datenschutz §9) and add the cleanup
  cron once decided.
- Uberspace keeps no Apache access logs by default — matches our
  Datenschutzerklärung nicely; don't enable them.
