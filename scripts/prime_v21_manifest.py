#!/usr/bin/env python3
"""V21 evidence manifest integrity audit. This is NOT external fact verification."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

def assess_manifest(data):
    if not isinstance(data,dict) or not isinstance(data.get("facts"),list):
        raise ValueError("Expected facts array")
    findings=[]
    for idx,f in enumerate(data["facts"]):
        evidence=f.get("evidence")
        if not isinstance(evidence,list) or not evidence:
            findings.append({"fact":idx,"reason":"EVIDENCE_MISSING"})
            continue
        for j,e in enumerate(evidence):
            if not isinstance(e,dict):
                findings.append({"fact":idx,"evidence":j,"reason":"INVALID_EVIDENCE"})
                continue
            url=e.get("url","")
            parsed=urlparse(url)
            if parsed.scheme!="https" or not parsed.netloc:
                findings.append({"fact":idx,"evidence":j,"reason":"INVALID_URL"})
            quote=e.get("excerpt","")
            if not isinstance(quote,str) or not quote.strip():
                findings.append({"fact":idx,"evidence":j,"reason":"EXCERPT_MISSING"})
            elif len(quote)>1500:
                findings.append({"fact":idx,"evidence":j,"reason":"EXCERPT_TOO_LONG"})
            observed=e.get("observed_at_utc")
            try:
                timestamp=dt.datetime.fromisoformat(observed.replace("Z","+00:00"))
                if timestamp.tzinfo is None or timestamp.utcoffset()!=dt.timedelta(0):
                    raise ValueError("UTC required")
            except (ValueError,AttributeError,TypeError):
                findings.append({"fact":idx,"evidence":j,"reason":"INVALID_UTC_TIMESTAMP"})
            digest=e.get("sha256")
            if not isinstance(digest,str) or len(digest)!=64 or any(c not in "0123456789abcdef" for c in digest):
                findings.append({"fact":idx,"evidence":j,"reason":"INVALID_SHA256"})
            elif isinstance(quote,str) and hashlib.sha256(quote.encode("utf-8")).hexdigest()!=digest:
                findings.append({"fact":idx,"evidence":j,"reason":"EXCERPT_HASH_MISMATCH"})
    return {"version":"V21","facts_received":len(data["facts"]),"findings":findings,
            "manifest_structurally_valid":bool(data["facts"]) and not findings,
            "facts_independently_verified":False,"publication_allowed":False,
            "limitations":["Hash integrity only; hashes do not prove the source was genuine.",
                           "Source URLs and excerpts must be independently verified by an authorized reviewer.",
                           "No external data retrieval or paid calls."]}
def main():
    p=argparse.ArgumentParser()
    p.add_argument("input",type=Path)
    p.add_argument("--out",type=Path,default=Path("qa-output"))
    a=p.parse_args()
    result=assess_manifest(json.loads(a.input.read_text(encoding="utf-8")))
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"v21_manifest_audit.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    print("V21: integrity",result["manifest_structurally_valid"],"; publication BLOCKED")
if __name__=="__main__":
    main()
