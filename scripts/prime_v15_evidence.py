#!/usr/bin/env python3
"""V15 offline evidence triage. Candidate matching is NOT fact certification."""
import argparse
import json
import re
from pathlib import Path
from prime_v14_offline import audit

NUM = re.compile(r"(?<![\\w])(?:[$€£]\\s*)?-?\\d[\\d,]*(?:\\.\\d+)?\\s*(?:%|bps|bp|million|billion|trillion)?", re.I)
STOP = {"2026", "2025", "2024", "13", "10", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"}
def numeric_tokens(text):
    return {re.sub(r"\\s+", "", m.group()).lower() for m in NUM.finditer(text) if re.sub(r"\\s+", "", m.group()).lower() not in STOP and len(re.sub(r"\\s+", "", m.group())) >= 3}

def triage(data):
    baseline = audit(data)
    answer = data.get("answer") or ""
    if not isinstance(answer, str):
        raise ValueError("answer must be text")
    lines = [line.strip() for line in answer.splitlines() if line.strip() and not line.lstrip().startswith("#")]
    candidate_lines = [(i + 1, line[:1200], numeric_tokens(line)) for i, line in enumerate(lines)]
    candidate_lines = [(i, line, tokens) for i, line, tokens in candidate_lines if tokens]
    rows = []
    for line_no, line, tokens in candidate_lines:
        matches = []
        for src in baseline["sources"]:
            source_tokens = numeric_tokens(src["excerpt"])
            overlap = sorted(tokens & source_tokens)
            if overlap:
                matches.append({"source_index": src["index"], "url": src["url"],
                                "time_status": src["time_status"], "shared_numeric_tokens": overlap[:15],
                                "content_time_risks": src["content_time_risks"]})
        rows.append({"line_number": line_no, "claim_excerpt": line[:400],
                     "numeric_tokens": sorted(tokens)[:20],
                     "candidate_sources": matches[:25],
                     "status": "CANDIDATE_NOT_VERIFIED" if matches else "NO_NUMERIC_MATCH",
                     "certified": False})
    return {"version": "V15", "date": data["date"], "kind": data.get("kind"),
            "claim_lines": rows, "source_count": len(baseline["sources"]),
            "certified_facts": [], "publication_allowed": False,
            "limitations": ["Numeric overlap is not entity/metric/period verification",
                            "Excerpt search is limited to 1000 characters per source",
                            "Publication always blocked pending independent verification"]}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--out", type=Path, default=Path("qa-output"))
    args = ap.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    result = triage(data)
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "v15_candidates.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.out / "v15_report.md").write_text(
        "# V15: numeric evidence triage (not certification)\\n\\n".replace("\\n","\n") +
        f"Claim lines: {len(result['claim_lines'])}. Source records: {result['source_count']}.\\n\\n".replace("\\n","\n") +
        "**Publication blocked.** Numeric overlap cannot validate a financial claim.\n", encoding="utf-8")
    print(f"V15 OFFLINE: {len(result['claim_lines'])} claim lines; {result['source_count']} sources; certified: 0; publication: BLOCKED")

if __name__ == "__main__":
    main()
