import base64
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import astra_probe as astra
import pilot


class AstraProbeTests(unittest.TestCase):
    def test_both_interfaces_keep_astra_and_the_hidden_phonetic_text(self):
        plans = astra.payloads()
        self.assertEqual(len(plans), 2)
        for route, payload in plans:
            self.assertEqual(payload['model'], 'gpt-6-astra')
        self.assertEqual(plans[0][1]['input'], 'weqqeʕ')
        self.assertEqual(plans[1][1]['messages'][-1]['content'], 'weqqeʕ')

    def test_definite_rejections_make_two_probes_and_are_not_replayed(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {'DARIJA_TTS_KEY': 'dummy'}, clear=True), patch.object(astra, 'request', side_effect=[
                {'http_status': 404, 'provider_code': 'model_not_found'},
                {'http_status': 400, 'provider_code': 'invalid_value'},
                {'http_status': 400, 'provider_code': 'unsupported_value'}]) as api:
            result = astra.run(Path(tmp))
            self.assertEqual(result['attempted_generation_requests'], 2)
            self.assertEqual(result['audio_files_generated'], 0)
            self.assertEqual(result['status'], 'audio_not_available_on_tested_endpoints')
            astra.run(Path(tmp)); self.assertEqual(api.call_count, 3)
            self.assertNotIn('dummy', ''.join(p.read_text() for p in Path(tmp).glob('*.json')))

    def test_timeout_does_not_try_another_interface_or_retry(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {'DARIJA_TTS_KEY': 'dummy'}, clear=True), patch.object(astra, 'request', side_effect=[
                {'http_status': 200, 'data': b'{"id":"gpt-6-astra"}'},
                {'http_status': None, 'transport_outcome_uncertain': True}]) as api:
            result = astra.run(Path(tmp))
            self.assertEqual(result['attempted_generation_requests'], 1)
            astra.run(Path(tmp)); self.assertEqual(api.call_count, 2)

    def test_provider_message_and_headers_are_not_persisted(self):
        result = astra.safe_error(400, json.dumps({'error': {'message': 'secret-should-not-appear audio not supported',
            'code': 'unsupported_value', 'param': 'modalities'}}).encode())
        self.assertTrue(result['mentions_audio_limitation'])
        self.assertNotIn('secret', json.dumps(result))
        self.assertEqual(result['parameter'], 'modalities')

    def test_other_models_cannot_be_presented_as_astra(self):
        response = {'model': 'gpt-4o-mini-tts', 'choices': [{'message': {'audio': {'data': base64.b64encode(b'fake').decode()}}}]}
        with self.assertRaisesRegex(pilot.PilotError, 'identity_mismatch'):
            astra.parse_audio('chat/completions', json.dumps(response).encode())
