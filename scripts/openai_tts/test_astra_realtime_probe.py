import json
import base64
import math
import struct
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import astra_realtime_probe as probe


class Socket:
    def __init__(self, events):self.events=iter(events);self.sent=[];self.closed=False
    def recv(self):return json.dumps(next(self.events))
    def send(self, text):self.sent.append(json.loads(text))
    def close(self):self.closed=True


class AstraRealtimeTests(unittest.TestCase):
    def test_received_pcm_is_saved_and_encoded_only_in_temporary_directory(self):
        pcm=b''.join(struct.pack('<h',int(6000*math.sin(2*math.pi*440*n/24000))) for n in range(24000))
        socket=Socket([{'type':'session.created','session':{'model':'gpt-6-astra'}},
                       {'type':'session.updated'},
                       {'type':'response.output_audio.delta','delta':base64.b64encode(pcm).decode()},
                       {'type':'response.done','response':{'status':'completed'}}])
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True):
            result=probe.run(Path(tmp),lambda key:socket)
            self.assertEqual(result['status'],'audio_ready_for_pilot')
            self.assertEqual(result['audio_files_generated'],1)
            self.assertTrue((Path(tmp)/'astra-realtime.mp3').is_file())
            self.assertFalse(result['linguistic_certification'])
            self.assertIsNone(result['confidence'])
            probe.run(Path(tmp),lambda key:self.fail('Aucune génération supplémentaire'))

    def test_rejection_creates_no_audio_or_response_and_is_not_retried(self):
        socket=Socket([{'type':'error','error':{'code':'invalid_model','param':'model','message':'unsupported model'}}])
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True):
            result=probe.run(Path(tmp),lambda key:socket)
            self.assertEqual(result['status'],'api_rejected')
            self.assertEqual(result['attempted_responses'],0)
            self.assertEqual(socket.sent,[])
            probe.run(Path(tmp),lambda key:self.fail('Aucun second essai'))
            self.assertTrue(socket.closed)
            self.assertNotIn('dummy',(Path(tmp)/'realtime-status.json').read_text())

    def test_other_model_is_rejected_before_generating(self):
        socket=Socket([{'type':'session.created','session':{'model':'gpt-realtime-2.1'}}])
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True):
            result=probe.run(Path(tmp),lambda key:socket)
            self.assertEqual(result['status'],'returned_model_identity_mismatch')
            self.assertEqual(socket.sent,[])

    def test_response_without_audio_does_not_trigger_another_generation(self):
        socket=Socket([{'type':'session.created','session':{'model':'gpt-6-astra'}},
                       {'type':'session.updated'},{'type':'session.updated'},
                       {'type':'response.done','response':{'status':'completed'}}])
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True):
            result=probe.run(Path(tmp),lambda key:socket)
            self.assertEqual(result['status'],'response_without_usable_audio')
            self.assertEqual(result['attempted_responses'],1)
            self.assertEqual(sum(e['type']=='response.create' for e in socket.sent),1)
            self.assertEqual(next(e for e in socket.sent if e['type']=='conversation.item.create')['item']['content'][0]['text'],'weqqeʕ')
