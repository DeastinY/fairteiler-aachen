#!/bin/sh
# API watchdog: restart once on failure, email only on state CHANGES
# (down or recovered) to avoid mail floods. Cron: every 10 minutes.
set -u
STATE="$HOME/fairteiler/health.state"
MAILTO="richard.polzin@posteo.de"
last=$(cat "$STATE" 2>/dev/null || echo "ok")

if curl -sf -m 10 http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
  if [ "$last" = "down" ]; then
    echo "Fairteiler-API ist wieder erreichbar ($(date))." \
      | mail -s "[fairteiler] API wieder ok" "$MAILTO" 2>/dev/null
  fi
  echo ok > "$STATE"
  exit 0
fi

# first failure: try one restart, then re-check
systemctl --user restart fairteiler-api 2>/dev/null
sleep 5
if curl -sf -m 10 http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
  echo "Fairteiler-API war down und wurde automatisch neu gestartet ($(date))." \
    | mail -s "[fairteiler] API neu gestartet" "$MAILTO" 2>/dev/null
  echo ok > "$STATE"
  exit 0
fi

if [ "$last" != "down" ]; then
  { echo "Fairteiler-API ist DOWN und Neustart half nicht ($(date))."; \
    systemctl --user --no-pager status fairteiler-api 2>&1 | head -15; } \
    | mail -s "[fairteiler] API DOWN" "$MAILTO" 2>/dev/null
fi
echo down > "$STATE"
exit 1
