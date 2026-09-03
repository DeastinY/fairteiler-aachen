import datetime as dt
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import crud, maintenance, push, seed, status
from app.models import FOOD_TAGS, Fairteiler, PushSubscription
from app.push import PushSettings


class ReportIn(BaseModel):
    type: Literal["brought", "taken", "empty"]
    tags: list[str] = []

    @field_validator("tags")
    @classmethod
    def known_tags(cls, value: list[str]) -> list[str]:
        unknown = [t for t in value if t not in FOOD_TAGS]
        if unknown:
            raise ValueError(f"unknown tags: {unknown}")
        return value


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

    def serialize(row: Fairteiler, reports, now, *, with_description=False) -> dict:
        data = {
            "id": row.id,
            "name": row.name,
            "street": row.street,
            "postalCode": row.postal_code,
            "city": row.city,
            "lat": row.lat,
            "lon": row.lon,
            "status": status.derive_status(reports, now),
            "activity7d": status.activity_by_day(reports, now),
        }
        if with_description:
            data["description"] = row.description
            data["regionName"] = row.region_name
            data["picture"] = row.picture
            data["reports"] = [
                {
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
        if not body.fairteilerIds:
            if existing is not None:
                session.delete(existing)
            return
        sub = existing or PushSubscription(endpoint=endpoint)
        sub.p256dh = body.subscription.keys.p256dh
        sub.auth = body.subscription.keys.auth
        sub.fairteiler_ids = body.fairteilerIds
        sub.quiet_hours = body.quietHours
        session.add(sub)

    @app.get("/api/fairteiler")
    def list_fairteiler(session: Session = Depends(get_session)):
        now = dt.datetime.now(dt.timezone.utc)
        return [
            serialize(row, crud.recent_reports(session, row.id), now)
            for row in seed.all_fairteiler(session)
        ]

    @app.get("/api/fairteiler/{fairteiler_id}")
    def fairteiler_detail(fairteiler_id: int, session: Session = Depends(get_session)):
        row = get_fairteiler_or_404(session, fairteiler_id)
        now = dt.datetime.now(dt.timezone.utc)
        reports = crud.recent_reports(session, row.id)
        return serialize(row, reports, now, with_description=True)

    @app.post("/api/fairteiler/{fairteiler_id}/reports", status_code=201)
    def create_report(
        fairteiler_id: int,
        body: ReportIn,
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
        if push_settings is not None and report.type == "brought":
            fairteiler = session.get(Fairteiler, fairteiler_id)
            push.notify_brought(session, fairteiler, report, push_settings)
        return {
            "type": report.type,
            "tags": list(report.tags or []),
            "createdAt": status._aware(report.created_at).isoformat(),
        }

    return app
