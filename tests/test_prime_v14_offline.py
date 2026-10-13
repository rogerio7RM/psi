import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("prime_v14", ROOT / "scripts" / "prime_v14_offline.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class OfflineAuditTests(unittest.TestCase):
    def test_gate_is_always_closed(self):
        result = module.audit({"date": "2026-10-13", "kind": "morning", "sources": []})
        self.assertFalse(result["publication_allowed"])
        self.assertEqual(result["certified_count"], 0)

    def test_naive_timestamp_is_not_assumed_utc(self):
        src = {"hd": "Example", "ts": "2026-10-13T12:00:00", "text": "Example"}
        result = module.audit({"date": "2026-10-13", "sources": [src]})
        self.assertEqual(result["sources"][0]["time_status"], "TIMEZONE_MISSING")

    def test_after_cutoff_is_flagged(self):
        src = {"ts": "2026-10-13T15:00:00+00:00", "text": "Example"}
        result = module.audit({"date": "2026-10-13", "sources": [src]})
        self.assertEqual(result["sources"][0]["time_status"], "AFTER_CUTOFF")

    def test_dedup_by_url_and_body(self):
        src = {"url": "https://example.org/a", "text": "Example"}
        result = module.audit({"date": "2026-10-13", "sources": [src, src]})
        self.assertEqual(len(result["sources"]), 1)

    def test_invalid_input_fails(self):
        with self.assertRaises(ValueError):
            module.audit({"date": "2026-10-13", "sources": "bad"})

if __name__ == "__main__":
    unittest.main()
