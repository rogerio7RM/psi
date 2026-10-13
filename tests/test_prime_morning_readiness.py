import json
import pathlib
import sys
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from prime_morning_readiness import build
class MorningReadinessTests(unittest.TestCase):
    def test_real_public_evidence_is_partial_and_blocked(self):
        data=json.loads((ROOT/"qa/public_evidence_2026-10-13.json").read_text(encoding="utf-8"))
        result=build(data)
        self.assertFalse(result["publication_allowed"])
        statuses={s["section"]:s["status"] for s in result["sections"]}
        self.assertEqual(statuses["Market Pulse"],"BLOCKED")
        self.assertEqual(statuses["Premarket Movers"],"BLOCKED")
        self.assertEqual(statuses["Agenda"],"PARTIAL_SOURCE_BACKED")
    def test_open_gate_is_rejected(self):
        with self.assertRaises(ValueError):
            build({"edition_date":"2026-10-13","kind":"morning","publication_allowed":True})
if __name__=="__main__":
    unittest.main()
