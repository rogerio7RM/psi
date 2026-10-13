#!/usr/bin/env python3
"""Build a conservative Morning Brief editorial readiness report from public evidence."""
import argparse
import json
from pathlib import Path

REQUIRED_SECTIONS = ("Wall Street 30s", "3 drivers", "Market Pulse", "Premarket Movers", "Agenda", "Earnings")
def build(data):
    if data.get("publication_allowed") is not False:
        raise ValueError("Evidence register must explicitly block publication")
    references=data.get("verified_references",[])
    blocked={s["section"]:s["reason"] for s in data.get("blocked_sections",[])}
    available={
        "Agenda":[r for r in references if r.get("type")=="official_calendar"],
        "Earnings":[r for r in references if r.get("type")=="sec_exhibit_99_1"],
    }
    sections=[]
    for name in REQUIRED_SECTIONS:
        refs=available.get(name,[])
        if name=="Earnings":
            status="PARTIAL_SOURCE_BACKED" if refs else "BLOCKED"
        elif name=="Agenda":
            status="PARTIAL_SOURCE_BACKED" if refs else "BLOCKED"
        else:
            status="BLOCKED"
        sections.append({"section":name,"status":status,
                         "references":[r["id"] for r in refs],
                         "missing":blocked.get(name) or ("Independent verified editorial coverage incomplete" if status=="BLOCKED" else "Full section coverage and editorial review")})
    return {"date":data["edition_date"],"kind":data["kind"],"sections":sections,
            "publication_allowed":False,"qa_status":"REVIEW_REQUIRED",
            "note":"Source references are public; this report does not certify live market quotes or automatically approve publication."}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("input",type=Path)
    p.add_argument("--out",type=Path,default=Path("qa-output"))
    a=p.parse_args()
    result=build(json.loads(a.input.read_text(encoding="utf-8")))
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"morning_readiness.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    lines=["# Morning Brief: editorial readiness", "",f"Date: {result['date']}","Publication: BLOCKED",""]
    for item in result["sections"]:
        lines.extend([f"## {item['section']}",f"Status: {item['status']}",f"Missing: {item['missing']}",""])
    (a.out/"morning_readiness.md").write_text("\n".join(lines),encoding="utf-8")
    print("Morning Brief readiness generated; publication BLOCKED")
if __name__=="__main__":
    main()
