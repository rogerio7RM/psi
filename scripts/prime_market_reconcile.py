#!/usr/bin/env python3
"""Reconcile same-instrument quote candidates without asserting exchange verification."""
import argparse
import json
from collections import defaultdict
from pathlib import Path
def reconcile(data):
    groups=defaultdict(list)
    for row in data.get("snapshots",[]):
        groups[(row.get("instrument"),row.get("unit"),row.get("contract_or_basis"))].append(row)
    series=[]
    for (instrument,unit,basis),rows in sorted(groups.items()):
        rows=sorted(rows,key=lambda x:x["observed_at_utc"])
        series.append({"instrument":instrument,"unit":unit,"basis":basis,
                       "observations":[{"time":r["observed_at_utc"],"price":r["price"],"source_url":r["source_url"]} for r in rows],
                       "latest_candidate":rows[-1]["price"],"latest_observed_at_utc":rows[-1]["observed_at_utc"],
                       "certified":False})
    return {"edition_date":data["edition_date"],"series":series,
            "excluded":data.get("excluded",[]),"publication_allowed":False,
            "note":"Observations at different timestamps are not competing same-time quotes. No cross-asset synchronization or independent exchange verification."}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("input",type=Path)
    p.add_argument("--out",type=Path,default=Path("qa-output"))
    a=p.parse_args()
    result=reconcile(json.loads(a.input.read_text(encoding="utf-8")))
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"market_candidate_reconciliation.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    print("Reconciled",len(result["series"]),"series; publication BLOCKED")
if __name__=="__main__":
    main()
