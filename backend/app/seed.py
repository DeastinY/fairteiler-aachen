import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import VIRTUAL_IDS, Fairteiler


def load_seed(session: Session, seed_path: Path) -> int:
    """Upsert fairteiler master data from the stripped seed file."""
    data = json.loads(Path(seed_path).read_text())
    count = 0
    for entry in data["fairteiler"]:
        if entry["id"] in VIRTUAL_IDS:
            continue
        row = session.get(Fairteiler, entry["id"]) or Fairteiler(id=entry["id"])
        row.name = (entry.get("name") or "").strip()
        row.description = entry.get("description")
        row.street = entry.get("street")
        row.postal_code = entry.get("postalCode")
        row.city = entry.get("city")
        row.lat = float(entry["lat"])
        row.lon = float(entry["lon"])
        row.region_name = entry.get("regionName")
        row.picture = entry.get("picture")
        session.add(row)
        count += 1
    return count


def all_fairteiler(session: Session) -> list[Fairteiler]:
    return list(session.scalars(select(Fairteiler).order_by(Fairteiler.id)))
