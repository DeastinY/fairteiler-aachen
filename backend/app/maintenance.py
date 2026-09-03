"""Retention cleanup and moderation helpers (used by manage.py and cron)."""

import datetime as dt

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import BlockedDevice, Report

RETENTION_DAYS = 90  # keep in sync with the Datenschutzerklärung


def prune_reports(session: Session, retention_days: int = RETENTION_DAYS) -> int:
    """Delete reports older than the retention period; returns count."""
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=retention_days)
    result = session.execute(
        delete(Report).where(Report.created_at < cutoff.replace(tzinfo=None))
    )
    return result.rowcount or 0


def is_blocked(session: Session, device_hash: str) -> bool:
    return (
        session.scalar(
            select(BlockedDevice).where(BlockedDevice.device_hash == device_hash)
        )
        is not None
    )


def block_device(session: Session, device_hash: str, reason: str = "") -> None:
    if not is_blocked(session, device_hash):
        session.add(BlockedDevice(device_hash=device_hash, reason=reason))


def unblock_device(session: Session, device_hash: str) -> bool:
    row = session.scalar(
        select(BlockedDevice).where(BlockedDevice.device_hash == device_hash)
    )
    if row is None:
        return False
    session.delete(row)
    return True
