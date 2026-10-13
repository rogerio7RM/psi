import importlib.util
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from prime_v15_evidence import triage

class V15Tests(unittest.TestCase):
    def test_numeric_overlap_is_not_certification(self):
        data={"date":"2026-10-13","kind":"morning","answer":"WTI traded at $92.54.","sources":[{"url":"https://example.com/oil","ts":"2026-10-13T12:00:00+00:00","text":"WTI $92.54"}]}
        r=triage(data)
        self.assertFalse(r["publication_allowed"])
        self.assertEqual(r["certified_facts"],[])
        self.assertEqual(r["claim_lines"][0]["status"],"CANDIDATE_NOT_VERIFIED")
    def test_no_match(self):
        data={"date":"2026-10-13","answer":"WTI traded at $92.54.","sources":[]}
        self.assertEqual(triage(data)["claim_lines"][0]["status"],"NO_NUMERIC_MATCH")
    def test_source_after_cutoff_still_not_certified(self):
        data={"date":"2026-10-13","answer":"WTI traded at $92.54.","sources":[{"ts":"2026-10-13T16:00:00+00:00","text":"WTI $92.54"}]}
        r=triage(data)
        self.assertEqual(r["claim_lines"][0]["candidate_sources"][0]["time_status"],"AFTER_CUTOFF")
        self.assertFalse(r["claim_lines"][0]["certified"])

if __name__=="__main__":
    unittest.main()
