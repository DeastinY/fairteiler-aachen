"""Self-hosted Web Push (VAPID) — no Firebase, no third-party relay.

Delivery goes through the push service of the subscriber's browser vendor,
end-to-end encrypted by the Web Push protocol itself (pywebpush handles the
aes128gcm encryption with the subscription's keys).
"""

import datetime as dt
import json
import logging
from dataclasses import dataclass
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import EMPTY, Fairteiler, PushSubscription, Report

logger = logging.getLogger(__name__)

QUIET_FROM = 21  # inclusive, Europe/Berlin
QUIET_TO = 8  # exclusive

TAG_LABELS = {
    "brot_backwaren": "Brot & Backwaren",
    "obst": "Obst",
    "gemuese": "Gemüse",
    "gekuehltes": "Gekühltes",
    "konserven": "Konserven",
    "zubereitetes": "Zubereitetes",
    "sonstiges": "Sonstiges",
}


@dataclass(frozen=True)
class PushSettings:
    public_key: str
    private_key: str
    subject: str


class EndpointGone(Exception):
    """The push service says this subscription no longer exists."""


def _berlin_now() -> dt.datetime:
    return dt.datetime.now(ZoneInfo("Europe/Berlin"))


def is_quiet(now: dt.datetime) -> bool:
    return now.hour >= QUIET_FROM or now.hour < QUIET_TO


def _send_webpush(subscription_info: dict, payload: str, settings: PushSettings):
    from pywebpush import WebPushException, webpush

    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=settings.private_key,
            vapid_claims={"sub": settings.subject},
        )
    except WebPushException as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        if status in (404, 410):
            raise EndpointGone() from exc
        raise


def build_payload(fairteiler: Fairteiler, report: Report) -> dict:
    if report.type == EMPTY:
        return {
            "title": fairteiler.name,
            "body": "Wurde leer gemeldet – magst du etwas vorbeibringen?",
            "url": f"/fairteiler/{fairteiler.id}",
            "tag": f"fairteiler-{fairteiler.id}-empty",
        }
    labels = [TAG_LABELS.get(t, t) for t in (report.tags or [])]
    body = "Etwas wurde gebracht"
    if labels:
        body += ": " + ", ".join(labels)
    return {
        "title": fairteiler.name,
        "body": body,
        "url": f"/fairteiler/{fairteiler.id}",
        "tag": f"fairteiler-{fairteiler.id}",
    }


def notify_report(
    session: Session,
    fairteiler: Fairteiler,
    report: Report,
    settings: PushSettings,
) -> None:
    """Best-effort fan-out; never raises into the report request.

    'brought' reaches everyone following the Fairteiler; 'empty' only those
    who opted into empty alerts (people who like to bring something)."""
    payload = json.dumps(build_payload(fairteiler, report), ensure_ascii=False)
    quiet_now = None
    for sub in session.scalars(select(PushSubscription)):
        if fairteiler.id not in (sub.fairteiler_ids or []):
            continue
        if report.type == EMPTY and not sub.empty_alerts:
            continue
        if sub.quiet_hours:
            if quiet_now is None:
                quiet_now = is_quiet(_berlin_now())
            if quiet_now:
                continue
        info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        try:
            _send_webpush(info, payload, settings=settings)
        except EndpointGone:
            session.delete(sub)
        except Exception:  # noqa: BLE001 — push must never break reporting
            logger.exception("web push to %s failed", sub.endpoint[:40])
