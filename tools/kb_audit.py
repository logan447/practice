#!/usr/bin/env python3
"""Staleness audit for the knowledge base (kb/).

Answers: "What in this repository needs to be rechecked?"

Reports, from source-record front matter:
  1. sources still status: unverified
  2. sources past their review-by date
  3. guideline-class sources not verified within MAX_AGE_MONTHS
  4. superseded sources still cited by topic pages

No dependencies; front matter is parsed as simple "key: value" lines.
Usage: python3 tools/kb_audit.py   (from the repo root)
"""

import re
import sys
from datetime import date, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCES = REPO / "kb" / "sources"
TOPICS = REPO / "kb" / "topics"
BOARDS = REPO / "kb" / "boards"

MAX_AGE_MONTHS = 12  # guideline-class sources should be re-verified within this
GUIDELINE_KINDS = {"guideline", "board-review"}


def front_matter(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"\A---\n(.*?)\n---\n", text, re.DOTALL)
    fields = {}
    if m:
        for line in m.group(1).splitlines():
            kv = re.match(r"([A-Za-z_-]+):\s*(.*?)\s*(#.*)?$", line)
            if kv and kv.group(2):
                fields[kv.group(1)] = kv.group(2)
    return fields


def parse_date(value):
    """Accept YYYY, YYYY-MM, YYYY-MM-DD; return a date or None."""
    if not value or value.upper() == "UNSET" or value in {"—", "-"}:
        return None
    m = re.match(r"(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?", value)
    if not m:
        return None
    y, mo, d = int(m.group(1)), int(m.group(2) or 12), int(m.group(3) or 28)
    return date(y, mo, d)


def main():
    if not SOURCES.is_dir():
        sys.exit(f"no {SOURCES} directory — run from the repo, after kb/ exists")

    today = date.today()
    cutoff = today - timedelta(days=MAX_AGE_MONTHS * 30)
    unverified, overdue, aging, dangling = [], [], [], []

    for path in sorted(SOURCES.glob("*.md")):
        fm = front_matter(path)
        sid = fm.get("id", path.stem)
        status = fm.get("status", "unverified")
        kind = fm.get("kind", "?")
        rel = path.relative_to(REPO)

        if status == "unverified":
            unverified.append((sid, kind, rel))

        rb = parse_date(fm.get("review-by", ""))
        if rb and rb < today:
            overdue.append((sid, kind, rel, fm.get("review-by")))

        if status == "current" and kind in GUIDELINE_KINDS:
            lv = parse_date(fm.get("last-verified", ""))
            if lv is None or lv < cutoff:
                aging.append((sid, kind, rel, fm.get("last-verified", "UNSET")))

        if status == "superseded":
            citing = [
                p.relative_to(REPO)
                for folder in (TOPICS, BOARDS)
                if folder.is_dir()
                for p in folder.rglob("*.md")
                if sid in p.read_text(encoding="utf-8")
            ]
            if citing:
                dangling.append((sid, rel, citing))

    def section(title, rows, fmt):
        print(f"\n{title} ({len(rows)})")
        if not rows:
            print("  none")
        for row in rows:
            print("  " + fmt(*row))

    print(f"KB staleness audit — {today}")
    section(
        "UNVERIFIED — captured but never checked against the live source",
        unverified,
        lambda sid, kind, rel: f"{sid}  [{kind}]  {rel}",
    )
    section(
        "PAST review-by — recheck now",
        overdue,
        lambda sid, kind, rel, rb: f"{sid}  [{kind}]  due {rb}  {rel}",
    )
    section(
        f"AGING — guideline-class, not verified in {MAX_AGE_MONTHS} months",
        aging,
        lambda sid, kind, rel, lv: f"{sid}  [{kind}]  last-verified {lv}  {rel}",
    )
    section(
        "SUPERSEDED but still cited — update the citing pages",
        dangling,
        lambda sid, rel, citing: f"{sid}  cited by: " + ", ".join(map(str, citing)),
    )

    total = len(unverified) + len(overdue) + len(aging) + len(dangling)
    print(f"\n{total} item(s) need attention" if total else "\nclean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
