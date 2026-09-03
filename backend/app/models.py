import datetime as dt

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

# Report types
BROUGHT = "brought"
TAKEN = "taken"
EMPTY = "empty"
CLEANED = "cleaned"
NEEDS_CLEANING = "needs_cleaning"
NEEDS_MAINTENANCE = "needs_maintenance"
REPORT_TYPES = (BROUGHT, TAKEN, EMPTY, CLEANED, NEEDS_CLEANING, NEEDS_MAINTENANCE)

FOOD_TAGS = (
    "brot_backwaren",
    "obst",
    "gemuese",
    "gekuehltes",
    "konserven",
    "zubereitetes",
    "sonstiges",
)

# Upstream entries that are not physical food-share points
VIRTUAL_IDS = {1578}


class Fairteiler(Base):
    __tablename__ = "fairteiler"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # upstream id
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    street: Mapped[str | None] = mapped_column(String(200))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    city: Mapped[str | None] = mapped_column(String(100))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    region_name: Mapped[str | None] = mapped_column(String(100))
    picture: Mapped[str | None] = mapped_column(String(400))
    cooled: Mapped[bool] = mapped_column(default=False)
    around_the_clock: Mapped[bool] = mapped_column(default=False)
    hours: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    endpoint: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    p256dh: Mapped[str] = mapped_column(String(200))
    auth: Mapped[str] = mapped_column(String(200))
    fairteiler_ids: Mapped[list] = mapped_column(JSON, default=list)
    quiet_hours: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc).replace(tzinfo=None),
    )


class UsageCounter(Base):
    """Anonymous daily aggregates — deliberately NO identifiers of any kind
    (no IP, no device hash, no user agent), so rows carry no personal data."""

    __tablename__ = "usage_counters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    day: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD (UTC)
    metric: Mapped[str] = mapped_column(String(40), index=True)
    count: Mapped[int] = mapped_column(Integer, default=0)


class BlockedDevice(Base):
    __tablename__ = "blocked_devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    reason: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc).replace(tzinfo=None),
    )


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fairteiler_id: Mapped[int] = mapped_column(
        ForeignKey("fairteiler.id"), index=True
    )
    type: Mapped[str] = mapped_column(String(20))
    tags: Mapped[list] = mapped_column(JSON, default=list)
    device_hash: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), index=True)
