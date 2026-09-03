import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import VIRTUAL_IDS, Fairteiler


AROUND_THE_CLOCK_HINTS = (
    "rund um die uhr",
    "jederzeit",
    "immer zugänglich",
    "ganztägig",
    "24/7",
)


COOLED_NEGATIONS = (
    "kein kühlschrank",
    "keinen kühlschrank",
    "ohne kühlschrank",
    "nicht mehr kühlt",
    "kühlt nicht",
    "als schrank umgebaut",
)


def derive_flags(description: str | None) -> dict:
    """Heuristic attribute flags from the upstream free-text description.

    Markdown markers are stripped before matching ("**keinen** Kühlschrank"),
    and common negations beat the keyword ("kein Kühlschrank", a fridge that
    "nicht mehr kühlt" or was "als Schrank umgebaut").
    """
    text = (description or "").lower().replace("*", "").replace("_", "")
    text = " ".join(text.split())  # collapse whitespace/newlines
    cooled = "kühlschrank" in text and not any(
        negation in text for negation in COOLED_NEGATIONS
    )
    return {
        "cooled": cooled,
        "around_the_clock": any(hint in text for hint in AROUND_THE_CLOCK_HINTS),
    }


def load_seed(session: Session, seed_path: Path) -> int:
    """Upsert fairteiler master data from the stripped seed file."""
    data = json.loads(Path(seed_path).read_text())
    overrides_path = Path(seed_path).parent / "overrides.json"
    overrides = (
        json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
    )
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
        flags = derive_flags(entry.get("description"))
        row.cooled = flags["cooled"]
        row.around_the_clock = flags["around_the_clock"]
        row.hours = overrides.get(str(entry["id"]), {}).get("hours")
        session.add(row)
        count += 1
    return count


def all_fairteiler(session: Session) -> list[Fairteiler]:
    return list(session.scalars(select(Fairteiler).order_by(Fairteiler.id)))
