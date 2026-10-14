"""Quatre appels au plus ; six fichiers conservés, sans service API réel."""
import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pilot
import revision


class RevisionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        # Fixture technique uniquement ; aucun audio à publier.
        import subprocess
        path = cls.root / "fixture.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i",
                        "sine=frequency=660:duration=1:sample_rate=24000", "-ac", "1", "-b:a", "64k", str(path)], check=True)
        cls.audio = path.read_bytes()
        with patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize", return_value=cls.audio), contextlib.redirect_stdout(io.StringIO()):
            pilot.generate(cls.root / "baseline-reports")
            cls.baseline = cls.root / "baseline-site"
            cls.manifest = pilot.build_review(cls.root / "baseline-reports", cls.baseline)
        config = json.loads(revision.CONFIG.read_text())
        config["baseline_review_id"] = cls.manifest["review_id"]
        cls.config = cls.root / "revision.json"
        cls.config.write_text(json.dumps(config))

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_only_four_requests_change_and_latin_never_changes(self):
        with patch.object(revision, "CONFIG", self.config):
            new = revision.revision_plan(self.baseline)
        old = {e["entry_id"]: e for e in pilot.plan()["entries"]}
        self.assertEqual(new["maximum_paid_requests"], 4)
        changed = []
        for entry in new["entries"]:
            self.assertEqual(entry["request"]["input"], old[entry["entry_id"]]["request"]["input"])
            if entry["key"] != old[entry["entry_id"]]["key"]:
                changed.append(entry["entry_id"])
        self.assertEqual(set(changed), revision.REVISED)

    def test_revision_uses_four_calls_retains_six_and_exports_previous_audio(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(revision, "CONFIG", self.config), patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize", return_value=self.audio) as api, contextlib.redirect_stdout(io.StringIO()):
            current = revision.revision_plan(self.baseline)
            reports = Path(tmp) / "reports"
            revision.seed(self.baseline, reports, current)
            pilot.generate(reports, pilot_plan=current, new_entry_ids=revision.REVISED, max_new_requests=4)
            self.assertEqual(api.call_count, 4)
            pilot.generate(reports, pilot_plan=current, new_entry_ids=revision.REVISED, max_new_requests=4)
            self.assertEqual(api.call_count, 4)
            site = Path(tmp) / "site"
            result = pilot.build_review(reports, site, pilot_plan=current)
            original = {e["id"]: e for e in self.manifest["entries"]}
            self.assertEqual(len(list(site.rglob("*.mp3"))), 24)
            self.assertEqual(result["revision"], 2)
            for entry in result["entries"]:
                if entry["revised"]:
                    self.assertEqual(pilot.file_sha256(site / entry["previous"]), original[entry["id"]]["after_sha256"])
                else:
                    self.assertEqual(pilot.file_sha256(site / entry["after"]), original[entry["id"]]["after_sha256"])
            status = json.loads((reports / "status.json").read_text())
            self.assertEqual(status["new_candidates"], 4)
            self.assertEqual(status["retained_candidates"], 6)
            self.assertIn('only-revised', (site / "index.html").read_text())
            self.assertIn('avis-openai-corrections.json', (site / "review.js").read_text())

    def test_missing_retained_audio_cannot_trigger_paid_regeneration(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(revision, "CONFIG", self.config), patch.dict(os.environ, {"DARIJA_TTS_KEY": "dummy"}, clear=True), patch.object(pilot, "synthesize") as api:
            current = revision.revision_plan(self.baseline)
            with self.assertRaisesRegex(pilot.PilotError, "retained_candidate_missing"):
                pilot.generate(Path(tmp), pilot_plan=current, new_entry_ids=revision.REVISED, max_new_requests=4)
            api.assert_not_called()

    def test_revision_cannot_expand_to_a_fifth_word(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = json.loads(self.config.read_text())
            config["instruction_overrides"]["corps-041"] = "Unrequested change"
            path = Path(tmp) / "bad.json"
            path.write_text(json.dumps(config))
            with patch.object(revision, "CONFIG", path), self.assertRaisesRegex(pilot.PilotError, "only_change_four"):
                revision.revision_plan(self.baseline)
