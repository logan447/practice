#!/usr/bin/env python3
"""Build the assistant corpus from the knowledge base (kb/).

Exports every note whose front matter opts in via `assistant:`
(clinician | patient | all) to kb/export/corpus.jsonl — one JSON
record per note, carrying provenance so the assistant can cite
sources and show their dates.

Hard rules (docs/systems/lm-assistant.md §2):
  - `assistant:` absent or `excluded`  -> never exported
  - sources with status unverified/superseded -> never exported,
    whatever `assistant:` says
  - exported notes citing unverified/superseded sources -> warning

No dependencies. Usage: python3 tools/kb_export.py   (from repo root)
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
KB = REPO / "kb"
OUT = KB / "export" / "corpus.jsonl"

AUDIENCES = {"clinician", "patient", "all"}
PROVENANCE_KEYS = [
    "org", "authors", "published", "doi", "pmid", "url",
    "added", "last-verified", "review-by", "status",
    "superseded-by", "population",
]


def split_note(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"\A---\n(.*?)\n---\n(.*)", text, re.DOTALL)
    if not m:
        return {}, text
    fields = {}
    for line in m.group(1).splitlines():
        kv = re.match(r"([A-Za-z_-]+):\s*(.*?)\s*(#.*)?$", line)
        if kv and kv.group(2):
            fields[kv.group(1)] = kv.group(2)
    return fields, m.group(2)


def tags_list(raw):
    return [t.strip() for t in raw.strip("[]").split(",") if t.strip()] if raw else []


def main():
    notes = sorted(p for p in KB.rglob("*.md")
                   if "templates" not in p.parts and "export" not in p.parts
                   and p.name != "README.md" and p.name != "tags.md")

    source_status = {}
    parsed = []
    for path in notes:
        fm, body = split_note(path)
        parsed.append((path, fm, body))
        if fm.get("id", "").startswith("src-"):
            source_status[fm["id"]] = fm.get("status", "unverified")

    records, skipped, warnings = [], [], []
    for path, fm, body in parsed:
        rel = str(path.relative_to(REPO))
        nid = fm.get("id", path.stem)
        audience = fm.get("assistant", "excluded")
        if audience not in AUDIENCES:
            skipped.append((nid, "not approved (assistant: %s)" % audience))
            continue
        status = fm.get("status")
        if status in ("unverified", "superseded"):
            skipped.append((nid, f"approved but status: {status} — blocked"))
            continue
        bad_cites = sorted({
            sid for sid in re.findall(r"src-[a-z0-9-]+", body)
            if source_status.get(sid, "current") in ("unverified", "superseded")
        })
        if bad_cites:
            warnings.append((nid, "cites non-current sources: " + ", ".join(bad_cites)))
        records.append({
            "id": nid,
            "kind": fm.get("kind", "topic" if "/topics/" in rel else "note"),
            "title": fm.get("title") or (re.search(r"^# (.+)$", body, re.M) or [None, nid])[1],
            "file": rel,
            "audience": audience,
            "tags": tags_list(fm.get("tags", "")),
            "provenance": {k: v for k in PROVENANCE_KEYS
                           if (v := fm.get(k)) and v.upper() != "UNSET" and v not in ("—", "-")},
            "body": body.strip(),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    gitignore = OUT.parent / ".gitignore"
    if not gitignore.exists():
        gitignore.write_text("*.jsonl\n", encoding="utf-8")
    with OUT.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"exported {len(records)} note(s) -> {OUT.relative_to(REPO)}")
    for nid, why in skipped:
        print(f"  skipped   {nid}: {why}")
    for nid, why in warnings:
        print(f"  WARNING   {nid}: {why}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
