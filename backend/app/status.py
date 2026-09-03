"""Derive a Fairteiler's live status and activity from its reports."""

import datetime as dt

from app.models import BROUGHT, CLEANED, EMPTY, NEEDS_CLEANING, NEEDS_MAINTENANCE, Report

FRESH_HOURS = 12
ACTIVITY_DAYS = 7
CARE_DAYS = 14


def derive_care(reports: list[Report], now: dt.datetime) -> dict:
    """Cleaning/maintenance flags: a problem stands until a newer 'cleaned'
    report (whoever fixes it reports that) or until it expires."""
    cutoff = now - dt.timedelta(days=CARE_DAYS)
    latest = {}
    for r in reports:
        when = _aware(r.created_at)
        if when < cutoff:
            continue
        if r.type in (CLEANED, NEEDS_CLEANING, NEEDS_MAINTENANCE):
            if r.type not in latest or when > latest[r.type]:
                latest[r.type] = when
    cleaned_at = latest.get(CLEANED)

    def standing(problem_type: str) -> bool:
        when = latest.get(problem_type)
        if when is None:
            return False
        return cleaned_at is None or when > cleaned_at

    return {
        "needsCleaning": standing(NEEDS_CLEANING),
        "needsMaintenance": standing(NEEDS_MAINTENANCE),
    }


def derive_status(reports: list[Report], now: dt.datetime) -> dict:
    """Status from the newest *decisive* report (brought/empty) within the
    freshness window; 'taken' counts as activity but decides nothing."""
    cutoff = now - dt.timedelta(hours=FRESH_HOURS)
    decisive = [
        r for r in reports
        if r.type in (BROUGHT, EMPTY) and _aware(r.created_at) >= cutoff
    ]
    if not decisive:
        return {"state": "keine_meldung", "lastReportAt": None, "tags": []}
    latest = max(decisive, key=lambda r: _aware(r.created_at))
    return {
        "state": "etwas_da" if latest.type == BROUGHT else "leer",
        "lastReportAt": _aware(latest.created_at).isoformat(),
        "tags": list(latest.tags or []),
    }


def activity_by_day(reports: list[Report], now: dt.datetime) -> list[int]:
    """Report counts per day, oldest first, today last (ACTIVITY_DAYS buckets)."""
    today = now.date()
    buckets = [0] * ACTIVITY_DAYS
    for report in reports:
        age_days = (today - _aware(report.created_at).date()).days
        if 0 <= age_days < ACTIVITY_DAYS:
            buckets[ACTIVITY_DAYS - 1 - age_days] += 1
    return buckets


MIN_REPORTS_FOR_BEST_TIME = 5
BEST_TIME_SHARE = 0.5  # a bucket must hold at least half of all brought reports


def best_time_of_day(reports: list) -> str | None:
    """morning/afternoon/evening (Europe/Berlin) — or None when the data is
    too thin or has no clear winner. Only 'brought' reports count."""
    from zoneinfo import ZoneInfo

    berlin = ZoneInfo("Europe/Berlin")
    buckets = {"morning": 0, "afternoon": 0, "evening": 0}
    total = 0
    for report in reports:
        if report.type != BROUGHT:
            continue
        hour = _aware(report.created_at).astimezone(berlin).hour
        if 6 <= hour < 12:
            buckets["morning"] += 1
        elif 12 <= hour < 18:
            buckets["afternoon"] += 1
        elif 18 <= hour < 23:
            buckets["evening"] += 1
        else:
            continue  # night drops don't make a recommendation
        total += 1
    if total < MIN_REPORTS_FOR_BEST_TIME:
        return None
    best, count = max(buckets.items(), key=lambda kv: kv[1])
    return best if count / total >= BEST_TIME_SHARE else None


def _aware(value: dt.datetime) -> dt.datetime:
    """SQLite drops tzinfo; stored values are UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.timezone.utc)
    return value
