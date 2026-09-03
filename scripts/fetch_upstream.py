#!/usr/bin/env python3
"""One-time / low-frequency fetch of Fairteiler master data from foodsharing.de.

Politeness contract (see IMPLEMENTATION_PLAN.md "Data sourcing"):
- never run this more than once per day;
- requests are sequential with a fixed delay, descriptive User-Agent;
- existing files in the output directory are NOT re-fetched (idempotent),
  so re-running after a partial failure only fetches what is missing;
- raw responses contain personal data (creator/manager profiles) and are
  written to an untracked directory; only the stripped seed
  (backend/seed/fairteiler.json) is meant for the repository.

Usage:
  python3 scripts/fetch_upstream.py --markers <markers.json> \
      --raw-dir data/upstream --out backend/seed/fairteiler.json
  If --markers is omitted the markers list is fetched (1 request).
"""

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

BASE = "https://foodsharing.de/api"
USER_AGENT = (
    "fairteiler-aachen/0.1 "
    "(one-time seed for a non-commercial Fairteiler companion app prototype)"
)
DELAY_SECONDS = 2.0
# Aachen city + immediate surroundings
BBOX = {"lat_min": 50.68, "lat_max": 50.87, "lon_min": 5.95, "lon_max": 6.25}

# Fields copied into the committed seed. Everything else (creator, managers,
# ...) is personal data and stays in the untracked raw files only.
SEED_FIELDS = (
    "id",
    "name",
    "description",
    "regionId",
    "regionName",
    "picture",
    "createdAt",
    "followerCount",
)


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def in_bbox(point: dict) -> bool:
    return (
        BBOX["lat_min"] <= float(point["lat"]) <= BBOX["lat_max"]
        and BBOX["lon_min"] <= float(point["lon"]) <= BBOX["lon_max"]
    )


def strip_details(details: dict, marker: dict) -> dict:
    seed = {field: details.get(field) for field in SEED_FIELDS}
    address = details.get("address") or {}
    location = details.get("location") or {}
    seed["street"] = address.get("street")
    seed["postalCode"] = address.get("postalCode")
    seed["city"] = address.get("city")
    seed["lat"] = location.get("lat", marker.get("lat"))
    seed["lon"] = location.get("lon", marker.get("lon"))
    return seed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--markers", help="path to an existing markers.json")
    parser.add_argument("--raw-dir", default="data/upstream")
    parser.add_argument("--out", default="backend/seed/fairteiler.json")
    parser.add_argument(
        "--refresh-markers",
        action="store_true",
        help="re-fetch the markers list (1 request) even if cached — for the "
        "daily sync; details are still only fetched for NEW ids",
    )
    args = parser.parse_args()

    raw_dir = Path(args.raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)

    markers_path = raw_dir / "markers.json"
    if args.refresh_markers:
        print("refreshing markers list (1 request)")
        data = get(f"{BASE}/map/markers/food-share-points")
        markers_path.write_bytes(data)
        markers = json.loads(data)
    elif args.markers:
        markers = json.loads(Path(args.markers).read_text())
    elif markers_path.exists():
        markers = json.loads(markers_path.read_text())
        print(f"reusing {markers_path}")
    else:
        print("fetching markers list (1 request)")
        data = get(f"{BASE}/map/markers/food-share-points")
        markers_path.write_bytes(data)
        markers = json.loads(data)

    aachen = sorted((m for m in markers if in_bbox(m)), key=lambda m: m["id"])
    print(f"{len(aachen)} points in the Aachen bounding box")

    seeds = []
    fetched = 0
    for marker in aachen:
        raw_path = raw_dir / f"fsp_{marker['id']}.json"
        if raw_path.exists():
            print(f"  {marker['id']:>5} cached  {marker['name']}")
        else:
            if fetched:
                time.sleep(DELAY_SECONDS)
            print(f"  {marker['id']:>5} FETCH   {marker['name']}")
            raw_path.write_bytes(get(f"{BASE}/food-share-points/{marker['id']}"))
            fetched += 1
        seeds.append(strip_details(json.loads(raw_path.read_text()), marker))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {"fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "fairteiler": seeds},
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(f"{fetched} new requests to foodsharing.de; seed -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
