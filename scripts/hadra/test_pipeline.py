import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from catalog import ROOT, file_sha256, job_key, latin_prompt, read_catalog, read_pilot
from engine import verify_download
from generate import cached_record
from quality import waveform_metrics


class CatalogTests(unittest.TestCase):
    def test_all_existing_audio_entries_are_enumerated_with_current_latin(self):
        catalog = read_catalog()
        self.assertEqual(len(catalog), 3511)
        self.assertEqual(catalog["adjectifs-052-ex"]["latin"], "ana 3tchan, 3tini lma")
        self.assertTrue(any(key.startswith("dia-") and key.endswith("-f") for key in catalog))
        self.assertEqual(catalog["numerique-032"]["latin"], "tilicharji")

    def test_pilot_resolves_corrected_words_and_has_50_distinct_entries(self):
        pilot = read_pilot(read_catalog(), ROOT / "scripts/hadra/pilot-50.json")
        self.assertEqual(len(pilot), 50)
        self.assertEqual(next(p for p in pilot if p.get("entry_id") == "salutations-012")["prompt"], "3afak")

    def test_numbers_and_gemination_are_not_spelled_as_numbers_or_dropped(self):
        self.assertEqual(latin_prompt("  3afak   we99e3 7da l9ahwa  "), "3afak we99e3 7da l9ahwa")
        with self.assertRaises(ValueError):
            latin_prompt("عافاك")

    def test_cache_key_changes_with_text_model_seed_and_voice(self):
        record = {"prompt": "3afak", "kind": "word"}
        spec = {"revision": "a" * 40, "vocoder": {"revision": "b" * 40}}
        ref = {"sha256": "voice"}
        original = job_key(record, spec, ref, {"seed": 0})
        self.assertNotEqual(original, job_key({**record, "prompt": "khobz"}, spec, ref, {"seed": 0}))
        self.assertNotEqual(original, job_key(record, {**spec, "revision": "c" * 40}, ref, {"seed": 0}))
        self.assertNotEqual(original, job_key(record, spec, ref, {"seed": 1}))
        self.assertNotEqual(original, job_key(record, spec, {"sha256": "other_voice"}, {"seed": 0}))


class IntegrityTests(unittest.TestCase):
    def test_corrupt_weight_with_same_size_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "model.safetensors"
            path.write_bytes(b"good")
            descriptor = {"size": 4, "lfs": {"sha256": hashlib.sha256(b"good").hexdigest()}}
            verify_download(path, descriptor)
            path.write_bytes(b"evil")
            with self.assertRaises(ValueError):
                verify_download(path, descriptor)

    def test_git_blob_config_is_verified(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "config.yaml"
            path.write_bytes(b"config")
            descriptor = {"size": 6, "blobId": hashlib.sha1(b"blob 6\0config").hexdigest()}
            verify_download(path, descriptor)
            descriptor["blobId"] = "0" * 40
            with self.assertRaises(ValueError):
                verify_download(path, descriptor)

    def test_corrupt_cached_wave_is_not_reused(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            (output / "masters").mkdir()
            (output / "records").mkdir()
            master = output / "masters/key.wav"
            master.write_bytes(b"wave")
            (output / "records/key.json").write_text(json.dumps({"master": "masters/key.wav", "master_sha256": file_sha256(master)}))
            self.assertIsNotNone(cached_record(output, "key"))
            master.write_bytes(b"bad!")
            self.assertIsNone(cached_record(output, "key"))


class TechnicalQualityTests(unittest.TestCase):
    def test_finite_non_silent_signal_passes_without_claiming_linguistic_validity(self):
        wave = 0.15 * np.sin(2 * np.pi * 440 * np.arange(24000) / 24000)
        metrics = waveform_metrics(wave, 24000, "word")
        self.assertTrue(metrics["passed"])
        self.assertNotIn("pronunciation_validated", metrics)

    def test_silence_clipping_nan_wrong_rate_and_stereo_fail(self):
        cases = [(np.zeros(24000), 24000), (np.ones(24000), 24000),
                 (np.full(24000, np.nan), 24000), (np.ones(24000) * 0.1, 16000),
                 (np.ones((24000, 2)) * 0.1, 24000)]
        for wave, rate in cases:
            with self.subTest(rate=rate, shape=wave.shape):
                self.assertFalse(waveform_metrics(wave, rate, "word")["passed"])

    def test_edge_silence_is_reported_without_erasing_fricatives(self):
        wave = np.concatenate([np.zeros(12000), np.full(12000, 0.01)])
        metrics = waveform_metrics(wave, 24000, "word")
        self.assertIn("long_edge_silence", metrics["warnings"])
        self.assertTrue(metrics["passed"])


if __name__ == "__main__":
    unittest.main()
