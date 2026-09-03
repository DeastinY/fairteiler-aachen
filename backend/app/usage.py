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
