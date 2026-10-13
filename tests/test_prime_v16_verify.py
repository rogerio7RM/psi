import pathlib
import sys
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from prime_v16_verify import verify
class V16Tests(unittest.TestCase):
    def test_matching_entity_number_never_certifies(self):
        data={"date":"2026-10-13","answer":"WTI reached $92.54.","sources":[{"url":"https://example.com/a","ts":"2026-10-13T12:00:00+00:00","text":"WTI at $92.54."}]}
        r=verify(data)
        self.assertEqual(r["claims"][0]["triage"],"CANDIDATE_FOR_MANUAL_VERIFICATION")
        self.assertFalse(r["publication_allowed"])
        self.assertFalse(r["claims"][0]["certified"])
    def test_wrong_entity_cannot_match(self):
        data={"date":"2026-10-13","answer":"WTI reached $92.54.","sources":[{"url":"https://example.com/a","ts":"2026-10-13T12:00:00+00:00","text":"BRENT at $92.54."}]}
        self.assertEqual(verify(data)["claims"][0]["triage"],"NO_ELIGIBLE_EVIDENCE")
    def test_after_cutoff_not_eligible(self):
        data={"date":"2026-10-13","answer":"WTI reached $92.54.","sources":[{"url":"https://example.com/a","ts":"2026-10-13T15:00:00+00:00","text":"WTI at $92.54."}]}
        self.assertEqual(verify(data)["claims"][0]["triage"],"NO_ELIGIBLE_EVIDENCE")
    def test_embedded_future_time_not_eligible(self):
        data={"date":"2026-10-13","answer":"WTI reached $92.54.","sources":[{"url":"https://example.com/a","ts":"2026-10-13T12:00:00+00:00","text":"WTI at $92.54 at 10:30 a.m. ET."}]}
        self.assertEqual(verify(data)["claims"][0]["triage"],"NO_ELIGIBLE_EVIDENCE")
if __name__=="__main__":
    unittest.main()
