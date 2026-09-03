"""Opening hours: curated per-Fairteiler tables and 'open now' derivation.

Hours format (curated in seed/overrides.json, never guessed from text):
  {"mo": [[10, 18]], "sa": [[10, 16.5]]}  — day keys mo..su, ranges in
  local hours, end exclusive. Missing day = closed. None = unknown.
"""

import datetime as dt
from zoneinfo import ZoneInfo

from app.models import Fairteiler

DAY_KEYS = ("mo", "tu", "we", "th", "fr", "sa", "su")


def berlin_now() -> dt.datetime:
    return dt.datetime.now(ZoneInfo("Europe/Berlin"))


def is_open_now(fairteiler: Fairteiler, now: dt.datetime | None = None) -> bool | None:
    """True/False when known, None when we simply don't know."""
    if fairteiler.around_the_clock:
        return True
    hours = fairteiler.hours
    if not hours:
        return None
    moment = now or berlin_now()
    ranges = hours.get(DAY_KEYS[moment.weekday()], [])
    current = moment.hour + moment.minute / 60
    return any(start <= current < end for start, end in ranges)
