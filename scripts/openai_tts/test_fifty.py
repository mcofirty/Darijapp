"""Budget de 49 appels, conservation du candidat préféré et intégrité des 100 MP3."""
import contextlib
import io
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import fifty
import pilot


class FiftyTests(unittest.TestCase):
    def test_plan_covers_fifty_unique_entries_and_all_themes_without_digits(self):
        spec = fifty.plan()
        self.assertEqual(len(spec['entries']), 50)
        self.assertEqual(len({e['entry_id'] for e in spec['entries']}), 50)
        self.assertEqual(len({e['theme'] for e in spec['entries']}), 31)
        self.assertEqual(spec['maximum_paid_requests'], 49)
        prompts = [e['request']['input'] for e in spec['entries']]
        self.assertTrue(all(not any(c.isdigit() for c in p) for p in prompts))
        for symbol in ['ʔ', 'ʕ', 'ħ', 'q', 'x', 'ɣ', 'ʃ', 'qq']:
            self.assertTrue(any(symbol in p for p in prompts), symbol)
        for entry in spec['entries']:
            if not entry.get('retained_sha256'):
                self.assertNotIn("verb meaning 'to sign'", entry['request']['instructions'])
        self.assertEqual(next(e for e in spec['entries'] if e.get('retained_sha256'))['latin'], 'we99e3')

    def test_49_requests_then_reuse_and_100_integrity_checked_files(self):
        with tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()):
            root = Path(tmp)
            fixture = root / 'signal.mp3'
            subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i',
                            'sine=frequency=440:duration=1:sample_rate=24000', '-ac', '1', '-b:a', '64k', str(fixture)], check=True)
            config = json.loads(fifty.CONFIG.read_text())
            config['retained_sha256'] = pilot.file_sha256(fixture)
            config_path = root / 'config.json'
            pilot.atomic_json(config_path, config)
            baseline = root / 'baseline'; baseline.mkdir()
            (baseline / 'preferred.mp3').write_bytes(fixture.read_bytes())
            request = next(r['request'] for r in fifty.phonetic_probe.plan()['records'] if r['profile'] == fifty.PROFILE)
            pilot.atomic_json(baseline / 'manifest.json', {
                'test_id': config['baseline_test_id'], 'model': config['model'], 'voice': 'cedar', 'latin': 'we99e3',
                'records': [{'profile': fifty.PROFILE, 'request': request, 'audio': 'preferred.mp3',
                             'sha256': config['retained_sha256']}]})
            with patch.object(fifty, 'CONFIG', config_path), patch.dict(os.environ, {'DARIJA_TTS_KEY': 'dummy'}, clear=True), patch.object(pilot, 'synthesize', return_value=fixture.read_bytes()) as api:
                output = root / 'reports'; site = root / 'site'
                fifty.generate(output, baseline)
                self.assertEqual(api.call_count, 49)
                fifty.generate(output, baseline)
                self.assertEqual(api.call_count, 49, 'Aucun appel API pour une reprise intacte')
                manifest = fifty.build(output, site)
                self.assertEqual(len(list(site.rglob('*.mp3'))), 100)
                self.assertFalse(manifest['linguistic_certification'])
                self.assertFalse(manifest['complete_ipa'])
                preferred = next(e for e in manifest['entries'] if e['retained_from_probe'])
                self.assertEqual(pilot.file_sha256(site / preferred['after']), config['retained_sha256'])
                self.assertNotIn('dummy', (site / 'manifest.json').read_text())
                tampered = manifest['entries'][1]
                (site / tampered['after']).write_bytes(b'corrupt')
                with self.assertRaisesRegex(pilot.PilotError, 'fifty_audio_integrity_failed'):
                    fifty.verify(site, pilot.ROOT)

    def test_rejects_51_entries_before_any_paid_request(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(pilot, 'synthesize') as api:
            config = json.loads(fifty.CONFIG.read_text())
            config['entry_ids'].append('salutations-001')
            path = Path(tmp) / 'config.json'; pilot.atomic_json(path, config)
            with patch.object(fifty, 'CONFIG', path), self.assertRaisesRegex(pilot.PilotError, 'invalid_fifty_budget'):
                fifty.generate(Path(tmp) / 'reports', Path(tmp) / 'baseline')
            api.assert_not_called()
