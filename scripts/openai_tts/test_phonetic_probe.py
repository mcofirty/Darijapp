import contextlib
import io
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import phonetic_probe as probe
import pilot


class PhoneticProbeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        audio = cls.root / 'signal.mp3'
        subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','sine=frequency=440:duration=1:sample_rate=24000',
                        '-ac','1','-b:a','64k',str(audio)],check=True)
        cls.audio=audio.read_bytes()
        cls.baseline=cls.root/'baseline';cls.baseline.mkdir()
        (cls.baseline/'old.mp3').write_bytes(cls.audio)
        pilot.atomic_json(cls.baseline/'manifest.json',{'entries':[{'id':probe.ENTRY_ID,'latin':'we99e3','after':'old.mp3','after_sha256':pilot.file_sha256(audio)}]})

    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()

    def test_payload_uses_audio_field_and_contains_no_digit_to_speak(self):
        spec=probe.plan()
        self.assertEqual(spec['maximum_paid_requests'],2)
        self.assertEqual(spec['latin'],'we99e3')
        self.assertEqual([r['request']['input'] for r in spec['records']],['weqqeʿ','weqqeʕ'])
        for r in spec['records']:self.assertFalse(any(c.isdigit() for c in r['request']['input']))

    def test_two_calls_then_cached_reuse_and_three_audio_files(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True),patch.object(pilot,'synthesize',return_value=self.audio) as api:
            output=Path(tmp)/'reports';site=Path(tmp)/'site'
            probe.generate(output,self.baseline)
            self.assertEqual(api.call_count,2)
            probe.generate(output,self.baseline)
            self.assertEqual(api.call_count,2)
            spec=probe.build(output,site)
            self.assertEqual(len(list(site.glob('*.mp3'))),3)
            self.assertFalse(spec['complete_ipa'])
            self.assertIn('weqqeʿ',(site/'index.html').read_text())
            self.assertNotIn('dummy',(site/'manifest.json').read_text())

    def test_uncertain_api_attempt_is_not_replayed(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True),patch.object(pilot,'synthesize',side_effect=pilot.PilotError('openai_connection_failed_no_automatic_retry')) as api:
            with self.assertRaises(pilot.PilotError):probe.generate(Path(tmp),self.baseline)
            with self.assertRaisesRegex(pilot.PilotError,'previous_probe_request_needs_review'):probe.generate(Path(tmp),self.baseline)
            self.assertEqual(api.call_count,1)
