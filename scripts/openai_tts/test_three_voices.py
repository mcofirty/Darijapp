import base64
import contextlib
import io
import json
import math
import os
import shutil
import struct
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import fifty
import pilot
import three_voices as three
from test_astra_realtime_probe import Socket


class ThreeVoiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory();cls.root=Path(cls.temp.name)
        fixture=cls.root/'signal.mp3'
        subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','sine=frequency=440:duration=1:sample_rate=24000',
                        '-ac','1','-b:a','64k',str(fixture)],check=True)
        cls.pcm=b''.join(struct.pack('<h',int(6000*math.sin(2*math.pi*440*n/24000))) for n in range(24000))
        cls.baseline=cls.root/'baseline';cls.baseline.mkdir();entries=[]
        for record in fifty.plan()['entries']:
            entry={k:record[k] for k in ['latin','arabe','fr','theme']}
            entry.update(id=record['entry_id'],tts_text=record['request']['input'],instructions=record['request']['instructions'],warnings=[])
            for side,source in [('before',pilot.ROOT/'public'/record['audio']),('after',fixture)]:
                path=cls.baseline/side/(record['entry_id']+'.mp3');path.parent.mkdir(exist_ok=True)
                shutil.copyfile(source,path);entry[side]=str(path.relative_to(cls.baseline));entry[side+'_sha256']=pilot.file_sha256(path)
            entries.append(entry)
        config=json.loads(three.SPEC.read_text())
        pilot.atomic_json(cls.baseline/'manifest.json',{'review_id':config['baseline_review_id'],
            'model':'gpt-4o-mini-tts-2025-12-15','voice':'cedar','count':50,'entries':entries})

    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()

    def socket(self,key,model):
        self.assertEqual(model,'gpt-realtime-2.1')
        return Socket([{'type':'session.created','session':{'model':model}}, {'type':'session.updated'},
            {'type':'response.output_audio.delta','delta':base64.b64encode(self.pcm).decode()},
            {'type':'response.done','response':{'status':'completed'}}])

    def test_ten_new_responses_then_cache_and_thirty_real_format_files(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True),patch.object(three.realtime,'connect',side_effect=self.socket) as api,contextlib.redirect_stdout(io.StringIO()):
            output=Path(tmp)/'reports';site=Path(tmp)/'site'
            three.generate(output,self.baseline);self.assertEqual(api.call_count,10)
            three.generate(output,self.baseline);self.assertEqual(api.call_count,10)
            manifest=three.build(output,self.baseline,site)
            self.assertEqual(len(list(site.rglob('*.mp3'))),30)
            self.assertEqual((site/'index.html').read_text().count('<audio '),3)
            self.assertNotIn('HADRA',(site/'index.html').read_text())
            self.assertNotIn('dummy',(site/'manifest.json').read_text())
            for entry in manifest['entries']:
                self.assertFalse(any(c.isdigit() for c in entry['tts_text']))
                old=next(e for e in json.loads((self.baseline/'manifest.json').read_text())['entries'] if e['id']==entry['id'])
                self.assertEqual(entry['jamal_sha256'],old['before_sha256'])
                self.assertEqual(entry['previous_sha256'],old['after_sha256'])
            self.assertFalse(manifest['linguistic_certification'])
            first=three.plan(self.baseline)['entries'][0]
            (three.record_dir(output,first)/'realtime.mp3').write_bytes(b'corrupt')
            with self.assertRaisesRegex(pilot.PilotError,'corrupt_no_regeneration'):three.generate(output,self.baseline)
            self.assertEqual(api.call_count,10)
            self.assertEqual(json.loads((output/'status.json').read_text())['status'],'blocked')

    def test_api_rejection_stops_at_first_entry_without_substituting_model(self):
        socket=Socket([{'type':'error','error':{'code':'invalid_model','message':'unsupported model'}}])
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'DARIJA_TTS_KEY':'dummy'},clear=True),patch.object(three.realtime,'connect',return_value=socket) as api:
            with self.assertRaisesRegex(pilot.PilotError,'generation_blocked'):three.generate(Path(tmp),self.baseline)
            with self.assertRaisesRegex(pilot.PilotError,'generation_blocked'):three.generate(Path(tmp),self.baseline)
            self.assertEqual(api.call_count,1)

    def test_same_named_mini_model_is_not_the_requested_model(self):
        self.assertFalse(three.realtime.model_matches('gpt-realtime-2.1-mini','gpt-realtime-2.1'))
        self.assertTrue(three.realtime.model_matches('gpt-realtime-2.1-2026-10-01','gpt-realtime-2.1'))
