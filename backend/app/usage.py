"""Anonymous usage counting: one (day, metric) row, incremented in place."""

import datetime as dt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import UsageCounter


def count(session: Session, metric: str) -> None:
    day = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    row = session.scalar(
        select(UsageCounter).where(
            UsageCounter.day == day, UsageCounter.metric == metric
        )
    )
    if row is None:
        session.add(UsageCounter(day=day, metric=metric, count=1))
    else:
        row.count += 1


def public_series(session: Session, report_counts: dict[str, int], days: int = 14) -> list[dict]:
    """Zero-filled per-day series for the public transparency stats."""
    today = dt.datetime.now(dt.timezone.utc).date()
    day_keys = [(today - dt.timedelta(days=offset)).isoformat() for offset in range(days - 1, -1, -1)]
    counters: dict[tuple[str, str], int] = {}
    for row in session.scalars(select(UsageCounter).where(UsageCounter.day >= day_keys[0])):
        counters[(row.day, row.metric)] = row.count
    return [
        {
            "day": day,
            "listViews": counters.get((day, "list_views"), 0),
            "detailViews": counters.get((day, "detail_views"), 0),
            "reports": report_counts.get(day, 0),
        }
        for day in day_keys
    ]


def report(session: Session, days: int = 14) -> list[tuple[str, str, int]]:
    cutoff = (
        dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    ).strftime("%Y-%m-%d")
    rows = session.scalars(
        select(UsageCounter)
        .where(UsageCounter.day >= cutoff)
        .order_by(UsageCounter.day.desc(), UsageCounter.metric)
    )
    return [(r.day, r.metric, r.count) for r in rows]
