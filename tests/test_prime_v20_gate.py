import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/"scripts"))
from prime_v20_gate import assess
class GateTests(unittest.TestCase):
    def test_empty_facts_block(self):
        self.assertFalse(assess({"facts":[],"editorial_approval":True,"manual_review_complete":True})["publication_allowed"])
    def test_missing_source_blocks(self):
        self.assertFalse(assess({"facts":[{"metric":"WTI","value":92.5}],"editorial_approval":True,"manual_review_complete":True})["publication_allowed"])
    def test_complete_metadata_without_approval_blocks(self):
        fact={"metric":"WTI","value":92.5,"source":"https://example.com","observation_period":"instant",
              "observed_at_utc":"2026-10-13T12:00:00Z","instrument":"CLZ26","unit":"USD/bbl","reviewed_by":"editor"}
        self.assertFalse(assess({"facts":[fact]})["publication_allowed"])
    def test_automated_review_blocks(self):
        fact={"metric":"WTI","value":92.5,"source":"https://example.com","observation_period":"instant",
              "observed_at_utc":"2026-10-13T12:00:00Z","instrument":"CLZ26","unit":"USD/bbl","reviewed_by":"automated"}
        self.assertFalse(assess({"facts":[fact],"editorial_approval":True,"manual_review_complete":True})["publication_allowed"])
if __name__=="__main__":
    unittest.main()
