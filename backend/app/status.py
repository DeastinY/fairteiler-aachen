"""Derive a Fairteiler's live status and activity from its reports."""

import datetime as dt

from app.models import BROUGHT, EMPTY, Report

FRESH_HOURS = 12
ACTIVITY_DAYS = 7


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


def _aware(value: dt.datetime) -> dt.datetime:
    """SQLite drops tzinfo; stored values are UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.timezone.utc)
    return value
