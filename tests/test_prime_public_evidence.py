import json
import pathlib
import unittest
from urllib.parse import urlparse
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PublicEvidenceTests(unittest.TestCase):
    def test_registry_is_fail_closed(self):
        data=json.loads((ROOT/"qa/public_evidence_2026-10-13.json").read_text(encoding="utf-8"))
        self.assertFalse(data["publication_allowed"])
        self.assertFalse(data["editorial_approval"])
        self.assertFalse(data["manual_review_complete"])
        self.assertTrue(data["blocked_sections"])
    def test_sources_are_public_https(self):
        data=json.loads((ROOT/"qa/public_evidence_2026-10-13.json").read_text(encoding="utf-8"))
        for ref in data["verified_references"]:
            parsed=urlparse(ref["source"])
            self.assertEqual(parsed.scheme,"https")
            self.assertIn(parsed.netloc,("www.bls.gov","www.sec.gov"))
    def test_no_bigdata_raw_data(self):
        data=json.loads((ROOT/"qa/public_evidence_2026-10-13.json").read_text(encoding="utf-8"))
        self.assertNotIn("sources",data)
        self.assertNotIn("answer",data)
if __name__=="__main__":
    unittest.main()
