#!/bin/sh
# Gentle daily upstream sync (per IMPLEMENTATION_PLAN "Data sourcing"):
# exactly 1 request/day for the markers list; detail fetches ONLY for
# newly appeared Fairteiler ids (usually zero). Never run more often.
# Writes OUTSIDE the git working tree so deploys stay clean.
set -eu
SYNC_DIR="$HOME/fairteiler/data"
# curated facts (opening hours) live next to whatever seed file is loaded
cp "$HOME/fairteiler-repo/backend/seed/overrides.json" "$SYNC_DIR/overrides.json"
"$HOME/fairteiler/venv/bin/python" "$HOME/fairteiler-repo/scripts/fetch_upstream.py" \
  --refresh-markers \
  --raw-dir "$SYNC_DIR/upstream" \
  --out "$SYNC_DIR/seed-live.json"
cd "$HOME/fairteiler-repo/backend"
set -a; . "$HOME/fairteiler/env"; set +a
"$HOME/fairteiler/venv/bin/python" manage.py seed --path "$SYNC_DIR/seed-live.json"
