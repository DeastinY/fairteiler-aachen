#!/bin/sh
# Deploy to Uberspace: build frontend locally, sync, update backend, restart.
# Usage: UBERSPACE=<user>@<star>.uberspace.de deploy/uberspace/deploy.sh
set -eu
: "${UBERSPACE:?set UBERSPACE=<user>@<star>.uberspace.de}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "== frontend: test + build (same-origin: no VITE_API_BASE/VITE_BASE) =="
cd "$ROOT/frontend"
npm run test
npm run build

echo "== sync frontend -> ~/www =="
rsync -az --delete --exclude '.htaccess' dist/ "$UBERSPACE":www/

echo "== update backend =="
ssh "$UBERSPACE" '
  set -eu
  cd ~/fairteiler-repo && git pull --ff-only
  ~/fairteiler/venv/bin/pip install -q -r backend/requirements.txt
  systemctl --user restart fairteiler-api
  sleep 3 && systemctl --user --no-pager status fairteiler-api | head -5
'

echo "== smoke check =="
ssh "$UBERSPACE" 'curl -sf http://127.0.0.1:8000/api/health && echo " api ok"'
echo "done."
