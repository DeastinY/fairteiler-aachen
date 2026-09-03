#!/bin/sh
# Nightly SQLite backup on Uberspace; reports are the only irreplaceable data.
set -eu
DB="$HOME/fairteiler/data/fairteiler.db"
OUT="$HOME/fairteiler/backups"
mkdir -p "$OUT"
[ -f "$DB" ] || exit 0
sqlite3 "$DB" ".backup '$OUT/fairteiler-$(date +%F).db'"
find "$OUT" -name 'fairteiler-*.db' -mtime +14 -delete
