"""Tests locaux du budget, de la reprise et de l’intégrité, sans appel OpenAI."""
import contextlib
import io
import json
import os
import subprocess
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

import pilot


class PilotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = tempfile.TemporaryDirectory()
        cls.fixture = Path(cls.fixtures.name) / "synthetic-test-fixture.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i",
                        "sine=frequency=440:duration=1.2:sample_rate=24000",
                        "-ac", "1", "-b:a", "64k", str(cls.fixture)], check=True)
        cls.audio = cls.fixture.read_bytes()

    @classmethod
    def tearDownClass(cls):
        cls.fixtures.cleanup()

    def test_plan_has_ten_actual_inputs_and_expected_sounds(self):
        plan = pilot.plan()
        self.assertEqual(plan["maximum_paid_requests"], 10)
        self.assertEqual(len(plan["entries"]), 10)
        prompts = [e["request"]["input"] for e in plan["entries"]]
        for sound in ["3", "7", "9", "kh", "gh", "ch", "99", "allah"]:
            self.assertTrue(any(sound in prompt for prompt in prompts), sound)
        for e in plan["entries"]:
            self.assertEqual(e["request"]["input"], e["latin"])
            self.assertNotEqual(e["request"]["input"], e["arabe"])
            self.assertEqual(e["request"]["response_format"], "mp3")

    def test_missing_key_makes_no_request_and_no_audio(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {}, clear=True), patch.object(pilot, "synthesize") as api:
            with self.assertRaisesRegex(pilot.PilotError, "missing_api_key"):
                pilot.generate(Path(tmp))
            api.assert_not_called()
            status = json.loads((Path(tmp) / "status.json").read_text())
            self.assertEqual(status["technically_ready"], 0)
            self.assertEqual(status["attempted"], 0)
            self.assertFalse(list(Path(tmp).rglob("*.mp3")))

    def test_ten_requests_then_reuse_and_twenty_verified_review_files(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {"DARIJA_TTS_KEY": "test-only-dummy"}, clear=True), patch.object(pilot, "synthesize", return_value=self.audio) as api, contextlib.redirect_stdout(io.StringIO()):
            reports = Path(tmp) / "reports"
            pilot.generate(reports)
            self.assertEqual(api.call_count, 10)
            pilot.generate(reports)
            self.assertEqual(api.call_count, 10, "La reprise ne doit pas être facturée")
            site = Path(tmp) / "site"
            manifest = pilot.build_review(reports, site)
            self.assertEqual(len(list(site.rglob("*.mp3"))), 20)
            self.assertEqual(manifest["count"], 10)
            self.assertFalse(manifest["linguistic_certification"])
            self.assertTrue(all(e["confidence"] is None for e in manifest["entries"]))
            self.assertNotIn("test-only-dummy", "".join(p.read_text() for p in reports.rglob("*.json")))
            for entry in manifest["entries"]:
                for label in ["before", "after"]:
                    self.assertEqual(pilot.file_sha256(site / entry[label]), entry[label + "_sha256"])
            self.assertIn("10 MOTS", (site / "index.html").read_text())
            self.assertIn("aucun déploiement", (site / "index.html").read_text())
            self.assertNotIn("HADRA", (site / "review.js").read_text())
            # A modified candidate must never reach publication.
            first = manifest["entries"][0]
            (reports / "audio" / Path(first["after"]).name).write_bytes(b"corrupted")
            with self.assertRaisesRegex(pilot.PilotError, "review_audio_integrity_failed"):
                pilot.build_review(reports, Path(tmp) / "corrupt-site")

    def test_uncertain_api_failure_is_not_automatically_retried(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize", side_effect=pilot.PilotError("openai_connection_failed_no_automatic_retry")) as api:
            with self.assertRaises(pilot.PilotError):
                pilot.generate(Path(tmp))
            self.assertEqual(api.call_count, 1)
            with self.assertRaisesRegex(pilot.PilotError, "previous_request_without_audio_requires_review"):
                pilot.generate(Path(tmp))
            self.assertEqual(api.call_count, 1)

    def test_corrupt_raw_cache_stops_before_new_paid_request(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize", return_value=self.audio) as api, contextlib.redirect_stdout(io.StringIO()):
            pilot.generate(Path(tmp))
            entry = pilot.plan()["entries"][0]
            path = Path(tmp) / "raw" / f"{entry['entry_id']}-{entry['key'][:12]}.mp3"
            path.write_bytes(b"corrupted")
            with self.assertRaisesRegex(pilot.PilotError, "cached_audio_corrupt_no_paid_regeneration"):
                pilot.generate(Path(tmp))
            self.assertEqual(api.call_count, 10)

    def test_authentication_rejection_stops_but_allows_correcting_key(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize", side_effect=pilot.PilotError("openai_http_401")) as api:
            with self.assertRaisesRegex(pilot.PilotError, "openai_http_401"):
                pilot.generate(Path(tmp))
            self.assertEqual(api.call_count, 1)
            self.assertFalse(list((Path(tmp) / "records").glob("*.json")))

    def test_hard_limit_rejects_larger_pilot_before_api(self):
        with tempfile.TemporaryDirectory() as tmp:
            spec = json.loads(pilot.SPEC.read_text())
            spec["entry_ids"].append("son-9elb")
            path = Path(tmp) / "spec.json"
            path.write_text(json.dumps(spec))
            with patch.object(pilot, "SPEC", path), self.assertRaisesRegex(pilot.PilotError, "exactly_10"):
                pilot.plan()

    def test_request_key_changes_with_instructions(self):
        old = pilot.plan()["entries"][0]["key"]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "instructions.txt"
            path.write_text(pilot.INSTRUCTIONS.read_text() + " Speak gently.")
            with patch.object(pilot, "INSTRUCTIONS", path):
                self.assertNotEqual(old, pilot.plan()["entries"][0]["key"])

    def test_api_error_exposes_quota_code_without_external_message(self):
        body = {"error": {"code": "insufficient_quota", "message": "secret text never retained"}}
        failure = urllib.error.HTTPError(pilot.ENDPOINT, 429, "Too Many Requests", {},
                                         io.BytesIO(json.dumps(body).encode()))
        with patch.object(pilot.urllib.request, "build_opener") as opener:
            opener.return_value.open.side_effect = failure
            with self.assertRaises(pilot.PilotError) as caught:
                pilot.synthesize(pilot.plan()["entries"][0]["request"], "test-only-dummy")
            self.assertEqual(caught.exception.provider_code, "insufficient_quota")
            self.assertEqual(str(caught.exception), "openai_http_429")
            self.assertNotIn("secret", str(caught.exception))

    def test_quota_rejection_stops_without_automatic_retry(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize", side_effect=pilot.PilotError("openai_http_429", "insufficient_quota")) as api:
            with self.assertRaises(pilot.PilotError):
                pilot.generate(Path(tmp))
            self.assertEqual(api.call_count, 1)
            status = json.loads((Path(tmp) / "status.json").read_text())
            self.assertEqual(status["provider_error_code"], "insufficient_quota")
            self.assertEqual(status["technically_ready"], 0)
            self.assertFalse(list((Path(tmp) / "records").glob("*.json")))

    def test_recovery_of_confirmed_rejection_keeps_audit_and_refuses_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            plan = pilot.plan();first = plan["entries"][0]
            basename = f"{first['entry_id']}-{first['key'][:12]}"
            record = {"key": first["key"], "technical_status": "pending"}
            path = output / "records" / f"{basename}.json"
            pilot.atomic_json(path, record)
            pilot.atomic_json(output / "status.json", {"error": "openai_http_429", "attempted": 1, "technically_ready": 0})
            raw = output / "raw" / f"{basename}.mp3"
            raw.parent.mkdir();raw.write_bytes(self.audio)
            with self.assertRaises(pilot.PilotError):
                pilot.recover_rejected_429(output, plan)
            self.assertTrue(path.exists())
            raw.unlink()
            pilot.recover_rejected_429(output, plan)
            self.assertFalse(path.exists())
            self.assertTrue(list((output / "rejections").glob("*.json")))

    def test_generation_cannot_replace_public_audio(self):
        with self.assertRaisesRegex(pilot.PilotError, "outside_public"):
            pilot.output_path(pilot.ROOT / "public/audio")


if __name__ == "__main__":
    unittest.main()
