#!/usr/bin/env python3
"""Validate independent, timestamped market snapshots. No quote fetching or publication."""
import argparse
import datetime as dt
import json
from pathlib import Path
from urllib.parse import urlparse
CUTOFF=dt.datetime(2026,10,13,13,30,tzinfo=dt.timezone.utc)
REQUIRED=("instrument","symbol","price","unit","observed_at_utc","source_url","source_type")
def validate(data):
    errors=[]
    if data.get("edition_date")!="2026-10-13" or data.get("kind")!="morning":
        errors.append({"reason":"EDITION_MISMATCH"})
    rows=data.get("snapshots",[])
    if not isinstance(rows,list):
        return {"valid":False,"errors":[{"reason":"SNAPSHOTS_NOT_LIST"}],"publication_allowed":False}
    if not rows:
        errors.append({"reason":"NO_SNAPSHOTS"})
    for i,row in enumerate(rows):
        if not isinstance(row,dict):
            errors.append({"row":i,"reason":"NOT_OBJECT"})
            continue
        for key in REQUIRED:
            if row.get(key) in (None,""):
                errors.append({"row":i,"reason":"MISSING_"+key.upper()})
        if isinstance(row.get("price"),bool) or not isinstance(row.get("price"),(float,int)) or row.get("price",0)<=0:
            errors.append({"row":i,"reason":"INVALID_PRICE"})
        url=urlparse(str(row.get("source_url","")))
        if url.scheme!="https" or not url.netloc:
            errors.append({"row":i,"reason":"INVALID_SOURCE_URL"})
        try:
            t=dt.datetime.fromisoformat(row["observed_at_utc"].replace("Z","+00:00"))
            if t.tzinfo is None or t.utcoffset()!=dt.timedelta(0):
                raise ValueError("UTC required")
            if t>CUTOFF:
                errors.append({"row":i,"reason":"POST_CUTOFF"})
        except (ValueError,KeyError,AttributeError,TypeError):
            errors.append({"row":i,"reason":"INVALID_TIMESTAMP"})
        if row.get("source_type") not in ("exchange","official_provider","licensed_vendor"):
            errors.append({"row":i,"reason":"SOURCE_TYPE_UNVERIFIED"})
        if not row.get("contract_or_basis"):
            errors.append({"row":i,"reason":"MISSING_CONTRACT_OR_BASIS"})
    return {"edition_date":"2026-10-13","rows":len(rows),"valid":not errors,"errors":errors,
            "publication_allowed":False,"independent_source_verification":False,
            "note":"Structural validation does not independently verify prices or source authenticity."}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("input",type=Path)
    p.add_argument("--out",type=Path,default=Path("qa-output"))
    a=p.parse_args()
    result=validate(json.loads(a.input.read_text(encoding="utf-8")))
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"market_snapshot_qa.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print("Market snapshots:",result["rows"],"errors:",len(result["errors"]),"publication BLOCKED")
if __name__=="__main__":
    main()
