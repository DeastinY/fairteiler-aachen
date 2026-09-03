#!/usr/bin/env python3
"""Generate printable QR sticker sheets for every Fairteiler.

Each sticker links straight to the report screen of one Fairteiler
(/melden?fairteiler=<id>) — scan, tap, report in 10 seconds. Output is one
self-contained HTML file (A4, print via browser) plus per-Fairteiler SVGs.

Usage:
  pip install segno   # once
  python3 scripts/generate_qr.py --base-url https://<user>.uber.space \
      [--out qr] [--seed backend/seed/fairteiler.json]
"""

import argparse
import html
import json
import pathlib

import segno

VIRTUAL_IDS = {1578}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--seed", default="backend/seed/fairteiler.json")
    parser.add_argument("--out", default="qr")
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    seed = json.loads(pathlib.Path(args.seed).read_text())

    cards = []
    for entry in sorted(seed["fairteiler"], key=lambda e: e["id"]):
        if entry["id"] in VIRTUAL_IDS:
            continue
        url = f"{base}/melden?fairteiler={entry['id']}"
        qr = segno.make(url, error="q")  # Q: sticker survives scratches
        svg_path = out / f"fairteiler-{entry['id']}.svg"
        qr.save(svg_path, kind="svg", scale=4, border=2, dark="#22301f")
        svg_markup = svg_path.read_text().split("?>", 1)[-1]
        cards.append(
            '<div class="card">'
            f"{svg_markup}"
            f"<h2>{html.escape(entry['name'])}</h2>"
            "<p>Etwas gebracht oder mitgenommen?<br>"
            "<strong>Scannen &amp; in 10 Sekunden melden</strong><br>"
            "– hilft allen zu sehen, was gerade da ist.</p>"
            f"<p class='url'>{html.escape(url)}</p>"
            "</div>"
        )

    sheet = (
        "<!doctype html><html lang='de'><head><meta charset='utf-8'>"
        "<title>Fairteiler QR-Sticker</title><style>"
        "body{font-family:system-ui,sans-serif;color:#22301f;margin:0;padding:10mm}"
        ".card{display:inline-block;width:85mm;padding:6mm;margin:2mm;"
        "border:1px dashed #999;border-radius:4mm;text-align:center;"
        "page-break-inside:avoid;vertical-align:top}"
        ".card svg{width:45mm;height:45mm}"
        "h2{font-size:14pt;margin:3mm 0 1mm}p{font-size:10pt;margin:1mm 0}"
        ".url{font-size:7pt;color:#666;word-break:break-all}"
        "@media print{.card{border-style:solid;border-color:#ccc}}"
        "</style></head><body>" + "".join(cards) + "</body></html>"
    )
    (out / "sticker-sheet.html").write_text(sheet)
    print(f"{len(cards)} stickers -> {out}/sticker-sheet.html (print via browser)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
