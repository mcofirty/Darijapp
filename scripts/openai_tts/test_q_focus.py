import contextlib
import io
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pilot
import q_focus as q
import test_three_voices as fixture
from test_astra_realtime_probe import Socket


class QFocusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fixture.ThreeVoiceTests.setUpClass()
        cls.temp = tempfile.TemporaryDirectory()
        cls.baseline = Path(cls.temp.name)
        shutil.copytree(fixture.ThreeVoiceTests.baseline, cls.baseline / 'test-audio-openai-50')
        entries = json.loads((fixture.ThreeVoiceTests.baseline / 'manifest.json').read_text())['entries']
        prior = cls.baseline / 'test-audio-trois-voix'
        prior.mkdir()
        retained = []
        for old in entries:
            if old['id'] not in ['corps-041', 'verbes-085']:
                continue
            relative = 'new/' + old['id'] + '.mp3'
            target = prior / relative
            target.parent.mkdir(exist_ok=True)
            shutil.copyfile(fixture.ThreeVoiceTests.baseline / old['after'], target)
            retained.append({'id': old['id'], 'new': relative, 'new_sha256': pilot.file_sha256(target)})
        config = json.loads(q.SPEC.read_text())
        pilot.atomic_json(prior / 'manifest.json', {'review_id': config['three_review_id'],
            'models': {'new': 'gpt-realtime-2.1'}, 'entries': retained})

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()
        fixture.ThreeVoiceTests.tearDownClass()

    def test_ten_calls_cache_preserved_sources_and_four_player_export(self):
        helper = fixture.ThreeVoiceTests()
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {'DARIJA_TTS_KEY': 'dummy'}, clear=True), \
                patch.object(q.three.realtime, 'connect', side_effect=helper.socket) as api, \
                contextlib.redirect_stdout(io.StringIO()):
            output, site = Path(tmp) / 'records', Path(tmp) / 'site'
            q.generate(output, self.baseline)
            q.generate(output, self.baseline)
            self.assertEqual(api.call_count, 10)
            manifest = q.build(output, self.baseline, site)
            self.assertEqual(len(list(site.rglob('*.mp3'))), 20)
            self.assertEqual((site / 'index.html').read_text().count('<audio '), 4)
            self.assertNotIn('HADRA', (site / 'index.html').read_text())
            self.assertIn('b_sha256: entry.b_sha256', (site / 'review.js').read_text())
            for entry in manifest['entries']:
                self.assertEqual(entry['candidates']['b']['tts_text'], entry['candidates']['a']['tts_text'].replace('q', 'ḳ'))
                self.assertFalse(any(c.isdigit() for c in entry['candidates']['a']['tts_text']))
                self.assertIsNone(entry['confidence'])
                self.assertEqual(entry['baseline_model'], 'gpt-realtime-2.1' if entry['id'] in ['corps-041', 'verbes-085'] else 'gpt-4o-mini-tts-2025-12-15')
            first = q.plan(self.baseline)['entries'][0]['candidates']['a']
            (q.three.record_dir(output, first) / 'realtime.mp3').write_bytes(b'corrupt')
            with self.assertRaisesRegex(pilot.PilotError, 'corrupt_no_regeneration'):
                q.generate(output, self.baseline)
            self.assertEqual(api.call_count, 10)
            self.assertEqual(json.loads((output / 'status.json').read_text())['status'], 'blocked')

    def test_rejection_stops_all_other_candidates_and_is_not_replayed(self):
        socket = Socket([{'type': 'error', 'error': {'code': 'invalid_model'}}])
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {'DARIJA_TTS_KEY': 'dummy'}, clear=True), \
                patch.object(q.three.realtime, 'connect', return_value=socket) as api:
            for _ in range(2):
                with self.assertRaisesRegex(pilot.PilotError, 'q_focus_generation_blocked'):
                    q.generate(Path(tmp), self.baseline)
            self.assertEqual(api.call_count, 1)

    def test_budget_change_is_rejected_before_any_generation(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = json.loads(q.SPEC.read_text())
            config['maximum_new_responses'] = 12
            spec = Path(tmp) / 'spec.json'
            pilot.atomic_json(spec, config)
            with patch.object(q, 'SPEC', spec), patch.object(q.three.realtime, 'run') as api:
                with self.assertRaisesRegex(pilot.PilotError, 'invalid_budget_or_model'):
                    q.generate(Path(tmp) / 'output', self.baseline)
                api.assert_not_called()
