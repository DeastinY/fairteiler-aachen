#!/usr/bin/env python3
"""Moderation and maintenance CLI (runs on the server next to run.py).

  .venv/bin/python manage.py reports [--days 7] [--fairteiler ID]
  .venv/bin/python manage.py delete-report REPORT_ID
  .venv/bin/python manage.py block DEVICE_HASH [--reason TEXT]
  .venv/bin/python manage.py unblock DEVICE_HASH
  .venv/bin/python manage.py blocked
  .venv/bin/python manage.py prune            # per Datenschutz: 90 Tage
"""

import argparse
import datetime as dt
import os
import pathlib
import sys

from sqlalchemy import select

from app import maintenance
from app.db import make_engine, make_session_factory
from app.models import BlockedDevice, Report

BASE = pathlib.Path(__file__).resolve().parent
DB_URL = os.environ.get("FAIRTEILER_DB", f"sqlite:///{BASE / 'fairteiler.db'}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_reports = sub.add_parser("reports")
    p_reports.add_argument("--days", type=int, default=7)
    p_reports.add_argument("--fairteiler", type=int)

    p_del = sub.add_parser("delete-report")
    p_del.add_argument("report_id", type=int)

    p_block = sub.add_parser("block")
    p_block.add_argument("device_hash")
    p_block.add_argument("--reason", default="")

    p_unblock = sub.add_parser("unblock")
    p_unblock.add_argument("device_hash")

    sub.add_parser("blocked")
    sub.add_parser("prune")

    p_usage = sub.add_parser("usage")
    p_usage.add_argument("--days", type=int, default=14)

    p_seed = sub.add_parser("seed")
    p_seed.add_argument("--path", default=str(BASE / "seed" / "fairteiler.json"))

    args = parser.parse_args()
    engine = make_engine(DB_URL)
    with make_session_factory(engine)() as session:
        if args.cmd == "reports":
            cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=args.days)
            query = (
                select(Report)
                .where(Report.created_at >= cutoff.replace(tzinfo=None))
                .order_by(Report.created_at.desc())
            )
            if args.fairteiler:
                query = query.where(Report.fairteiler_id == args.fairteiler)
            for r in session.scalars(query):
                tags = ",".join(r.tags or [])
                print(
                    f"{r.id:>6} {r.created_at:%Y-%m-%d %H:%M} fsp={r.fairteiler_id} "
                    f"{r.type:<8} [{tags}] device={r.device_hash[:16]}…"
                )
        elif args.cmd == "delete-report":
            row = session.get(Report, args.report_id)
            if row is None:
                print("not found", file=sys.stderr)
                return 1
            session.delete(row)
            print(f"deleted report {args.report_id}")
        elif args.cmd == "block":
            maintenance.block_device(session, args.device_hash, args.reason)
            print(f"blocked {args.device_hash[:16]}…")
        elif args.cmd == "unblock":
            ok = maintenance.unblock_device(session, args.device_hash)
            print("unblocked" if ok else "was not blocked")
        elif args.cmd == "blocked":
            for b in session.scalars(select(BlockedDevice)):
                print(f"{b.device_hash} {b.created_at:%Y-%m-%d} {b.reason}")
        elif args.cmd == "prune":
            count = maintenance.prune_reports(session)
            print(f"pruned {count} reports older than {maintenance.RETENTION_DAYS} days")
        elif args.cmd == "usage":
            from app import usage as usage_mod

            for day, metric, count in usage_mod.report(session, args.days):
                print(f"{day}  {metric:<16} {count:>6}")
        elif args.cmd == "seed":
            from app.seed import load_seed

            count = load_seed(session, pathlib.Path(args.path))
            print(f"seeded/updated {count} fairteiler from {args.path}")
        session.commit()
    return 0


if __name__ == "__main__":
    sys.exit(main())
