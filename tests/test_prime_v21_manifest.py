import hashlib
import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/"scripts"))
from prime_v21_manifest import assess_manifest
def valid():
    excerpt="WTI source excerpt for integrity testing."
    return {"facts":[{"metric":"WTI","evidence":[{"url":"https://example.org/test","excerpt":excerpt,
             "observed_at_utc":"2026-10-13T12:00:00Z","sha256":hashlib.sha256(excerpt.encode()).hexdigest()}]}]}
class V21Tests(unittest.TestCase):
    def test_valid_manifest_still_blocks_publication(self):
        result=assess_manifest(valid())
        self.assertTrue(result["manifest_structurally_valid"])
        self.assertFalse(result["facts_independently_verified"])
        self.assertFalse(result["publication_allowed"])
    def test_modified_excerpt_detected(self):
        data=valid()
        data["facts"][0]["evidence"][0]["excerpt"]="tampered"
        self.assertIn("EXCERPT_HASH_MISMATCH",[x["reason"] for x in assess_manifest(data)["findings"]])
    def test_missing_evidence_detected(self):
        self.assertIn("EVIDENCE_MISSING",[x["reason"] for x in assess_manifest({"facts":[{}]})["findings"]])
    def test_naive_timestamp_rejected(self):
        data=valid()
        data["facts"][0]["evidence"][0]["observed_at_utc"]="2026-10-13T12:00:00"
        self.assertIn("INVALID_UTC_TIMESTAMP",[x["reason"] for x in assess_manifest(data)["findings"]])
if __name__=="__main__":
    unittest.main()
