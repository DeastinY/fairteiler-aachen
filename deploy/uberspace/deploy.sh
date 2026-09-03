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

echo "== sync frontend -> ~/www/html =="
rsync -az --delete --exclude '.htaccess' dist/ "$UBERSPACE":www/html/

echo "== update backend (repo is private: push over SSH, no GitHub on the server) =="
cd "$ROOT"
git push uberspace main
ssh "$UBERSPACE" '
  set -eu
  ~/fairteiler/venv/bin/pip install -q -r ~/fairteiler-repo/backend/requirements.txt
  systemctl --user restart fairteiler-api
  sleep 3 && systemctl --user --no-pager status fairteiler-api | head -4
'

echo "== smoke check =="
ssh "$UBERSPACE" 'curl -sf http://127.0.0.1:8000/api/health && echo " api ok"'
echo "done."
