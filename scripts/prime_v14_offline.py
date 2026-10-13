#!/usr/bin/env python3
"""Fail-closed, offline PrimeSphere V14 source audit. Never publishes."""
import argparse
import datetime as dt
import hashlib
import json
import re
from zoneinfo import ZoneInfo
from pathlib import Path
from urllib.parse import urlparse

def content_time_risks(body, cutoff):
    """Flag explicit ET observations after the cutoff; never treat them as certified facts."""
    risks = []
    pattern = r"\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*(a\.?m\.?|p\.?m\.?)\s*(?:ET|Eastern Time)\b"
    for m in re.finditer(pattern, body, re.IGNORECASE):
        hour = int(m.group(1)) % 12 + (12 if m.group(3).lower().startswith("p") else 0)
        local = cutoff.astimezone(ZoneInfo("America/New_York")).replace(hour=hour, minute=int(m.group(2)), second=0, microsecond=0)
        if local.astimezone(dt.timezone.utc) > cutoff:
            risks.append({"mention": m.group(0), "reason": "POSSIBLE_POST_CUTOFF_OBSERVATION"})
    return risks

def audit(data):
    if not isinstance(data, dict) or not isinstance(data.get("sources"), list):
        raise ValueError("Invalid input: expected object with sources list")
    cutoff = dt.datetime.fromisoformat(data["date"] + "T13:30:00+00:00")
    seen = set()
    sources = []
    for i, src in enumerate(data["sources"]):
        body = "\n".join([src.get("text") or ""] + [c.get("text") or "" for c in src.get("chunks", [])])
        url = src.get("url") or (src.get("action") or {}).get("url") or ""
        digest = hashlib.sha256(body.encode()).hexdigest()
        key = (url, digest)
        if key in seen:
            continue
        seen.add(key)
        raw_ts = src.get("ts")
        status = "MISSING_TIMESTAMP"
        if raw_ts:
            try:
                stamp = dt.datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
                status = ("TIMEZONE_MISSING" if stamp.tzinfo is None else
                          "AFTER_CUTOFF" if stamp.astimezone(dt.timezone.utc) > cutoff else
                          "PRE_CUTOFF_SOURCE_UNVERIFIED")
            except (ValueError, TypeError):
                status = "INVALID_TIMESTAMP"
        sources.append({"index": i, "title": src.get("hd") or "",
                        "url": url, "domain": urlparse(url).hostname or "",
                        "timestamp": raw_ts, "time_status": status,
                        "excerpt": body[:1000], "sha256": digest,
                        "certified": False, "content_time_risks": content_time_risks(body, cutoff)})
    return {"version": "V14-CI", "date": data["date"], "kind": data.get("kind"),
            "sources": sources, "certified_facts": [], "certified_count": 0,
            "qa_status": "REVIEW_REQUIRED", "publication_allowed": False,
            "reason": "No independent source verification performed"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--out", type=Path, default=Path("qa-output"))
    args = ap.parse_args()
    result = audit(json.loads(args.input.read_text(encoding="utf-8")))
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "facts.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    gate = {"publication_allowed": False, "certified_facts": 0, "status": "BLOCKED"}
    (args.out / "gate.json").write_text(json.dumps(gate, indent=2), encoding="utf-8")
    (args.out / "report.md").write_text(
        "# PrimeSphere V14 offline QA\n\n"
        f"Sources: {len(result['sources'])}; certified facts: 0.\n\n"
        "**Publication: BLOCKED.** No independent validation was performed.\n",
        encoding="utf-8")
    print(f"V14 OFFLINE: {len(result['sources'])} unique source records; certified: 0; publication: BLOCKED")

if __name__ == "__main__":
    main()
