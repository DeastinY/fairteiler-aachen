"""Essenskörbe (foodsharing baskets), proxied gently through our server.

Design contract (see IMPLEMENTATION_PLAN "Data sourcing"):
- our server is the ONLY thing that ever talks to foodsharing.de — user
  browsers never do, so no visitor data reaches the upstream;
- lazy: upstream is queried only when someone opens the map AND the cache
  is older than TTL_MINUTES; hard DAILY_CAP as a safety valve;
- we keep and expose nothing but id + coordinates (as published on the
  public foodsharing map) — no basket contents, no personal data;
- upstream failure degrades to the stale cache, never to an error.
"""

import datetime as dt
import json
import urllib.request

TTL_MINUTES = 30
DAILY_CAP = 30
USER_AGENT = "fairteiler-aachen/1.0 (+https://github.com/DeastinY/fairteiler-aachen)"
UPSTREAM = "https://foodsharing.de/api/map/markers/baskets"

# Aachen city + immediate surroundings (same box as the seed script)
BBOX = {"lat_min": 50.68, "lat_max": 50.87, "lon_min": 5.95, "lon_max": 6.25}

_cache: dict = {"items": None, "fetched_at": None, "day": None, "fetches_today": 0}


def reset_cache() -> None:
    _cache.update({"items": None, "fetched_at": None, "day": None, "fetches_today": 0})


def _fetch_upstream() -> list[dict]:
    request = urllib.request.Request(UPSTREAM, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read())


def _in_bbox(marker: dict) -> bool:
    try:
        return (
            BBOX["lat_min"] <= float(marker["lat"]) <= BBOX["lat_max"]
            and BBOX["lon_min"] <= float(marker["lon"]) <= BBOX["lon_max"]
        )
    except (KeyError, TypeError, ValueError):
        return False


def get_baskets(now: dt.datetime | None = None) -> dict:
    moment = now or dt.datetime.now(dt.timezone.utc)
    today = moment.date().isoformat()
    if _cache["day"] != today:
        _cache["day"] = today
        _cache["fetches_today"] = 0

    fresh = (
        _cache["fetched_at"] is not None
        and moment - _cache["fetched_at"] < dt.timedelta(minutes=TTL_MINUTES)
    )
    if not fresh and _cache["fetches_today"] < DAILY_CAP:
        try:
            _cache["fetches_today"] += 1
            raw = _fetch_upstream()
            _cache["items"] = [
                {"id": int(m["id"]), "lat": float(m["lat"]), "lon": float(m["lon"])}
                for m in raw
                if _in_bbox(m)
            ]
            _cache["fetched_at"] = moment
            fresh = True
        except Exception:  # noqa: BLE001 — degrade to stale cache
            fresh = False

    return {
        "baskets": _cache["items"] or [],
        "fetchedAt": _cache["fetched_at"].isoformat() if _cache["fetched_at"] else None,
        "stale": not fresh,
    }
