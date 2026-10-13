import pathlib
import sys
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from prime_market_snapshots import validate
def row():
    return {"instrument":"WTI future","symbol":"CL","price":92.5,"unit":"USD/bbl",
            "observed_at_utc":"2026-10-13T12:00:00Z","source_url":"https://example.org/quotes",
            "source_type":"exchange","contract_or_basis":"CLZ26"}
class SnapshotTests(unittest.TestCase):
    def test_empty_is_blocked(self):
        self.assertFalse(validate({"edition_date":"2026-10-13","kind":"morning","snapshots":[]})["valid"])
    def test_structurally_valid_still_not_verified(self):
        r=validate({"edition_date":"2026-10-13","kind":"morning","snapshots":[row()]})
        self.assertTrue(r["valid"])
        self.assertFalse(r["publication_allowed"])
    def test_post_cutoff_rejected(self):
        a=row();a["observed_at_utc"]="2026-10-13T14:30:00Z"
        self.assertIn("POST_CUTOFF",[e["reason"] for e in validate({"edition_date":"2026-10-13","kind":"morning","snapshots":[a]})["errors"]])
    def test_missing_contract_rejected(self):
        a=row();del a["contract_or_basis"]
        self.assertIn("MISSING_CONTRACT_OR_BASIS",[e["reason"] for e in validate({"edition_date":"2026-10-13","kind":"morning","snapshots":[a]})["errors"]])
if __name__=="__main__":
    unittest.main()
