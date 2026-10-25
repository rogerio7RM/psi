#!/usr/bin/env python3
"""V16: conservative claim-level evidence checks. No financial fact certification."""
import argparse
import json
import re
from pathlib import Path
from prime_v14_offline import audit

AMOUNT = re.compile(r"(?<![\w])(?:[$€£]\s*)?-?\d[\d,]*(?:\.\d+)?\s*(?:%|bps|bp)?", re.I)
ENTITY = re.compile(r"\b(SPX|S&P\s*500|NASDAQ|QQQ|DOW|DJIA|VIX|WTI|BRENT|GOLD|OURO|GLD|TSLA|NVDA|AAPL|MSFT|AMZN|META|GOOGL|NFLX|CPI|PPI|FED|YIELD|TREASURY)\b", re.I)
def tokens(s):
    return {re.sub(r"\s+", "", x.group()).lower() for x in AMOUNT.finditer(s) if len(re.sub(r"\s+", "", x.group())) >= 3}
def entities(s):
    return {re.sub(r"\s+", "", x.group()).upper() for x in ENTITY.finditer(s)}
def body(src):
    return "\n".join([src.get("text") or ""] + [c.get("text") or "" for c in src.get("chunks", [])])
def verify(data):
    baseline = audit(data)
    answer = data.get("answer") or ""
    if not isinstance(answer, str):
        raise ValueError("answer must be string")
    rows=[]
    for n,line in enumerate(answer.splitlines(),1):
        line=line.strip()
        nums=tokens(line)
        ents=entities(line)
        if not nums or not ents:
            continue
        evidence=[]
        for source in data["sources"]:
            sb=body(source)
            shared_nums=nums & tokens(sb)
            shared_ents=ents & entities(sb)
            if shared_nums and shared_ents:
                source_url=source.get("url") or (source.get("action") or {}).get("url") or ""
                audit_record=next((r for r in baseline["sources"] if r["url"]==source_url and r["excerpt"]==sb[:1000]),None)
                evidence.append({"url":source_url,"matching_numbers":sorted(shared_nums),
                                 "matching_entities":sorted(shared_ents),
                                 "time_status":audit_record["time_status"] if audit_record else "UNKNOWN",
                                 "content_time_risks":audit_record["content_time_risks"] if audit_record else []})
        eligible=[e for e in evidence if e["time_status"]=="PRE_CUTOFF_SOURCE_UNVERIFIED" and not e["content_time_risks"]]
        rows.append({"line":n,"claim":line[:600],"numbers":sorted(nums),"entities":sorted(ents),
                     "evidence_candidates":evidence[:20],
                     "triage":"CANDIDATE_FOR_MANUAL_VERIFICATION" if eligible else "NO_ELIGIBLE_EVIDENCE",
                     "certified":False})
    return {"version":"V16","date":data["date"],"kind":data.get("kind"),
            "claims":rows,"certified_facts":[],"publication_allowed":False,
            "limitations":["Matching entity and number does not prove matching instrument, metric, period, units, or observation time.",
                           "Only explicit US Eastern observation times are screened; other timezone claims need manual review.",
                           "No independent external verification; no publication permitted."]}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("input",type=Path)
    p.add_argument("--out",type=Path,default=Path("qa-output"))
    a=p.parse_args()
    data=json.loads(a.input.read_text(encoding="utf-8"))
    result=verify(data)
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"v16_evidence.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    print(f"V16: {len(result['claims'])} claims; 0 certified; publication BLOCKED")
if __name__=="__main__":
    main()
