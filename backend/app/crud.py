import datetime as dt
import hashlib

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Report
from app.status import ACTIVITY_DAYS

RATE_LIMIT_MINUTES = 10
UNDO_WINDOW_MINUTES = 15
DEVICE_SALT = "fairteiler-aachen"  # overridden via env in production


def hash_device(device_id: str) -> str:
    return hashlib.sha256(f"{DEVICE_SALT}:{device_id}".encode()).hexdigest()


def create_report(
    session: Session,
    *,
    fairteiler_id: int,
    type: str,
    tags: list[str],
    device_hash: str,
    created_at: dt.datetime | None = None,
) -> Report:
    when = created_at or dt.datetime.now(dt.timezone.utc)
    if when.tzinfo is not None:  # store naive UTC for consistent comparisons
        when = when.astimezone(dt.timezone.utc).replace(tzinfo=None)
    report = Report(
        fairteiler_id=fairteiler_id,
        type=type,
        tags=tags,
        device_hash=device_hash,
        created_at=when,
    )
    session.add(report)
    session.flush()
    return report


def recent_reports(
    session: Session, fairteiler_id: int, days: int = ACTIVITY_DAYS
) -> list[Report]:
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    return list(
        session.scalars(
            select(Report)
            .where(Report.fairteiler_id == fairteiler_id)
            .where(Report.created_at >= cutoff.replace(tzinfo=None))
            .order_by(Report.created_at.desc())
        )
    )


def last_report_by_device(
    session: Session, fairteiler_id: int, device_hash: str
) -> Report | None:
    return session.scalars(
        select(Report)
        .where(Report.fairteiler_id == fairteiler_id)
        .where(Report.device_hash == device_hash)
        .order_by(Report.created_at.desc())
        .limit(1)
    ).first()
