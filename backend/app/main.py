import datetime as dt
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Path, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import (
    baskets as baskets_mod,
    crud,
    hours as hours_mod,
    maintenance,
    photos as photos_mod,
    push,
    seed,
    status,
    usage,
)
from app.models import FOOD_TAGS, Fairteiler, PushSubscription
from app.push import PushSettings


class ReportIn(BaseModel):
    type: Literal[
        "brought",
        "taken",
        "empty",
        "cleaned",
        "needs_cleaning",
        "needs_maintenance",
        "access_ok",
        "access_hard",
    ]
    tags: list[str] = []

    @field_validator("tags")
    @classmethod
    def known_tags(cls, value: list[str]) -> list[str]:
        if len(value) > len(FOOD_TAGS):
            raise ValueError("zu viele Kategorien")
        unknown = [t for t in value if t not in FOOD_TAGS]
        if unknown:
            raise ValueError(f"unknown tags: {unknown}")
        return list(dict.fromkeys(value))  # dedupe, keep order


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscriptionIn(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


class PushSubscriptionIn(BaseModel):
    subscription: SubscriptionIn
    fairteilerIds: list[int] = []
    quietHours: bool = False
    baskets: bool = False
    emptyAlerts: bool = False


def create_app(
    *, engine, session_factory, push_settings: PushSettings | None = None
) -> FastAPI:
    import os

    app = FastAPI(title="Fairteiler Aachen API")
    app.add_middleware(
        CORSMiddleware,
        # same-origin deploys need no CORS; cross-origin (e.g. GitHub Pages)
        # sets CORS_ORIGINS="https://<user>.github.io"
        allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def get_session():
        with session_factory() as session:
            yield session
            session.commit()

    def get_fairteiler_or_404(session: Session, fairteiler_id: int) -> Fairteiler:
        row = session.get(Fairteiler, fairteiler_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Fairteiler nicht gefunden")
        return row

    def access_reports(session: Session, fairteiler_id: int):
        return crud.recent_reports(session, fairteiler_id, days=status.ACCESS_DAYS)

    def serialize(
        row: Fairteiler, reports, now, *, with_description=False, access=None
    ) -> dict:
        accessible, accessible_source = status.derive_accessibility(
            access if access is not None else [], row.accessible, now
        )
        data = {
            "id": row.id,
            "name": row.name,
            "street": row.street,
            "postalCode": row.postal_code,
            "city": row.city,
            "lat": row.lat,
            "lon": row.lon,
            "cooled": row.cooled,
            "aroundTheClock": row.around_the_clock,
            "openNow": hours_mod.is_open_now(row),
            "accessible": accessible,
            "accessibleSource": accessible_source,
            "status": status.derive_status(reports, now),
            "care": status.derive_care(reports, now),
            "activity7d": status.activity_by_day(reports, now),
        }
        if with_description:
            data["description"] = row.description
            data["regionName"] = row.region_name
            data["picture"] = row.picture
            data["hours"] = row.hours
            data["photoUrl"] = (
                f"/api/fairteiler/{row.id}/photo" if row.picture else None
            )
            data["reports"] = [
                {
                    "id": r.id,
                    "type": r.type,
                    "tags": list(r.tags or []),
                    "createdAt": status._aware(r.created_at).isoformat(),
                }
                for r in reports[:10]
            ]
        return data

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/push/config")
    def push_config():
        if push_settings is None:
            return {"enabled": False, "vapidPublicKey": None}
        return {"enabled": True, "vapidPublicKey": push_settings.public_key}

    @app.put("/api/push/subscription", status_code=204)
    def put_push_subscription(
        body: PushSubscriptionIn,
        x_device_id: str = Header(min_length=4, max_length=128),
        session: Session = Depends(get_session),
    ):
        if push_settings is None:
            raise HTTPException(
                status_code=503,
                detail="Push ist auf diesem Server nicht aktiviert.",
            )
        known_ids = {row.id for row in seed.all_fairteiler(session)}
        unknown = [i for i in body.fairteilerIds if i not in known_ids]
        if unknown:
            raise HTTPException(
                status_code=422, detail=f"Unbekannte Fairteiler: {unknown}"
            )
        endpoint = body.subscription.endpoint
        existing = session.scalar(
            select(PushSubscription).where(PushSubscription.endpoint == endpoint)
        )
        if not body.fairteilerIds and not body.baskets:
            if existing is not None:
                session.delete(existing)
            return
        sub = existing or PushSubscription(endpoint=endpoint)
        sub.p256dh = body.subscription.keys.p256dh
        sub.auth = body.subscription.keys.auth
        sub.fairteiler_ids = body.fairteilerIds
        sub.quiet_hours = body.quietHours
        sub.baskets = body.baskets
        sub.empty_alerts = body.emptyAlerts
        session.add(sub)

    @app.get("/api/baskets")
    def baskets(session: Session = Depends(get_session)):
        return baskets_mod.get_baskets(session=session, push_settings=push_settings)

    @app.get("/api/stats")
    def stats(session: Session = Depends(get_session)):
        now = dt.datetime.now(dt.timezone.utc)
        rows = seed.all_fairteiler(session)
        with_food = 0
        reports_7d = 0
        report_counts: dict[str, int] = {}
        for row in rows:
            reports = crud.recent_reports(session, row.id, days=14)
            for r in reports:
                day = status._aware(r.created_at).date().isoformat()
                report_counts[day] = report_counts.get(day, 0) + 1
            week = [
                r for r in reports
                if status._aware(r.created_at) >= now - dt.timedelta(days=7)
            ]
            reports_7d += len(week)
            if status.derive_status(reports, now)["state"] == "etwas_da":
                with_food += 1
        return {
            "fairteilerTotal": len(rows),
            "withFood": with_food,
            "reports7d": reports_7d,
            "pushSubscriptions": session.query(PushSubscription).count(),
            "usage14d": usage.public_series(session, report_counts),
        }

    @app.get("/api/fairteiler")
    def list_fairteiler(session: Session = Depends(get_session)):
        usage.count(session, "list_views")
        now = dt.datetime.now(dt.timezone.utc)
        return [
            serialize(
                row,
                crud.recent_reports(session, row.id),
                now,
                access=access_reports(session, row.id),
            )
            for row in seed.all_fairteiler(session)
        ]

    @app.get("/api/fairteiler/{fairteiler_id}")
    def fairteiler_detail(
        fairteiler_id: int = Path(ge=1, le=2_000_000_000),
        session: Session = Depends(get_session),
    ):
        row = get_fairteiler_or_404(session, fairteiler_id)
        usage.count(session, "detail_views")
        now = dt.datetime.now(dt.timezone.utc)
        reports = crud.recent_reports(session, row.id)
        data = serialize(
            row, reports, now, with_description=True, access=access_reports(session, row.id)
        )
        data["bestTime"] = status.best_time_of_day(
            crud.recent_reports(session, row.id, days=90)
        )
        return data

    @app.get("/api/fairteiler/{fairteiler_id}/photo")
    def fairteiler_photo(
        fairteiler_id: int = Path(ge=1, le=2_000_000_000),
        session: Session = Depends(get_session),
    ):
        row = get_fairteiler_or_404(session, fairteiler_id)
        result = photos_mod.get_photo(row.id, row.picture)
        if result is None:
            raise HTTPException(status_code=404, detail="Kein Foto vorhanden")
        data, content_type = result
        return Response(
            content=data,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=604800"},
        )

    @app.post("/api/fairteiler/{fairteiler_id}/reports", status_code=201)
    def create_report(
        body: ReportIn,
        fairteiler_id: int = Path(ge=1, le=2_000_000_000),
        x_device_id: str = Header(min_length=4, max_length=128),
        session: Session = Depends(get_session),
    ):
        get_fairteiler_or_404(session, fairteiler_id)
        device_hash = crud.hash_device(x_device_id)
        if maintenance.is_blocked(session, device_hash):
            raise HTTPException(
                status_code=403,
                detail="Dieses Gerät wurde wegen Missbrauchs gesperrt.",
            )
        previous = crud.last_report_by_device(session, fairteiler_id, device_hash)
        now = dt.datetime.now(dt.timezone.utc)
        if previous is not None:
            age = now - status._aware(previous.created_at)
            if age < dt.timedelta(minutes=crud.RATE_LIMIT_MINUTES):
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Für diesen Fairteiler hast du gerade schon gemeldet – "
                        f"bitte warte ein paar Minuten ({crud.RATE_LIMIT_MINUTES} Min Abstand)."
                    ),
                )
        report = crud.create_report(
            session,
            fairteiler_id=fairteiler_id,
            type=body.type,
            tags=body.tags,
            device_hash=device_hash,
        )
        if push_settings is not None and report.type in ("brought", "empty"):
            fairteiler = session.get(Fairteiler, fairteiler_id)
            push.notify_report(session, fairteiler, report, push_settings)
        return {
            "id": report.id,
            "type": report.type,
            "tags": list(report.tags or []),
            "createdAt": status._aware(report.created_at).isoformat(),
        }

    @app.delete("/api/reports/{report_id}", status_code=204)
    def delete_own_report(
        report_id: int = Path(ge=1, le=2_000_000_000),
        x_device_id: str = Header(min_length=4, max_length=128),
        session: Session = Depends(get_session),
    ):
        from app.models import Report

        report = session.get(Report, report_id)
        if report is None:
            raise HTTPException(status_code=404, detail="Meldung nicht gefunden")
        if report.device_hash != crud.hash_device(x_device_id):
            raise HTTPException(
                status_code=403, detail="Nur eigene Meldungen können gelöscht werden."
            )
        age = dt.datetime.now(dt.timezone.utc) - status._aware(report.created_at)
        if age > dt.timedelta(minutes=crud.UNDO_WINDOW_MINUTES):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Eigene Meldungen lassen sich nur innerhalb von "
                    f"{crud.UNDO_WINDOW_MINUTES} Minuten zurücknehmen."
                ),
            )
        session.delete(report)

    return app
