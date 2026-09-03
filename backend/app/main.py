import datetime as dt
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app import crud, seed, status
from app.models import FOOD_TAGS, Fairteiler


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


def create_app(*, engine, session_factory) -> FastAPI:
    app = FastAPI(title="Fairteiler Aachen API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tightened to the app origin at deploy time
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
        return {
            "type": report.type,
            "tags": list(report.tags or []),
            "createdAt": status._aware(report.created_at).isoformat(),
        }

    return app
