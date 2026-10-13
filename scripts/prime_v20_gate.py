#!/usr/bin/env python3
"""V20 publication readiness: enforce evidence completeness and an explicit review gate."""
import argparse
import json
from pathlib import Path

REQUIRED = ("metric", "value", "source", "observation_period", "observed_at_utc", "instrument", "unit", "reviewed_by")
def assess(data):
    if not isinstance(data, dict) or not isinstance(data.get("facts"), list):
        raise ValueError("Expected JSON object with facts list")
    issues=[]
    for index, fact in enumerate(data["facts"]):
        missing=[key for key in REQUIRED if not fact.get(key)]
        if missing:
            issues.append({"index":index,"reason":"MISSING_EVIDENCE_FIELDS","fields":missing})
        if fact.get("reviewed_by") and fact.get("reviewed_by")=="automated":
            issues.append({"index":index,"reason":"HUMAN_REVIEW_REQUIRED"})
        if fact.get("source") and not str(fact["source"]).startswith("https://"):
            issues.append({"index":index,"reason":"INVALID_SOURCE_URL"})
    # No implicit publication even with complete evidence: separate explicit approval is required.
    approved = bool(data.get("editorial_approval") is True and data.get("manual_review_complete") is True)
    allowed = bool(data["facts"]) and not issues and approved
    return {"version":"V20","facts_received":len(data["facts"]),
            "issues":issues,"manual_approval":approved,"publication_allowed":allowed,
            "note":"V20 checks evidence metadata, not factual truth; external primary-source verification remains mandatory."}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("input",type=Path)
    p.add_argument("--out",type=Path,default=Path("qa-output"))
    a=p.parse_args()
    result=assess(json.loads(a.input.read_text(encoding="utf-8")))
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"v20_gate.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print("V20 gate:", "OPEN" if result["publication_allowed"] else "BLOCKED")
if __name__=="__main__":
    main()
