"""Dernière vérification Astra via Realtime : une session, une réponse maximum."""
import argparse
import base64
import json
import hashlib
import os
import re
import subprocess
import time
import wave
from pathlib import Path

import astra_probe
import pilot
import phonetic_probe


class Rejection(Exception):
    def __init__(self, diagnostic):
        self.diagnostic = diagnostic


def connect(key, model=astra_probe.MODEL):
    import websocket
    try:
        return websocket.create_connection('wss://api.openai.com/v1/realtime?model=' + model,
            header=['Authorization: Bearer ' + key], timeout=30, redirect_limit=0)
    except websocket.WebSocketBadStatusException as exc:
        body = exc.resp_body or b''
        if isinstance(body, str):
            body = body.encode()
        raise Rejection(astra_probe.safe_error(exc.status_code, body)) from None


def request_identity(model, tts_text, instructions):
    return hashlib.sha256(json.dumps({'model': model, 'tts_text': tts_text,
        'instructions': instructions, 'voice': 'cedar', 'pcm_rate': 24000}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def model_matches(actual, model):
    return isinstance(actual, str) and (actual == model or bool(re.fullmatch(re.escape(model) + r'-\d{4}-\d{2}-\d{2}', actual)))


def run(output, connector=None, *, model=astra_probe.MODEL, tts_text='weqqeʕ', instructions=None):
    output = pilot.output_path(output)
    instructions = instructions or phonetic_probe.INSTRUCTIONS
    request_key = request_identity(model, tts_text, instructions)
    prefix = 'astra-realtime' if model == astra_probe.MODEL else 'realtime'
    path = output / 'realtime-status.json'
    if path.exists():
        saved = json.loads(path.read_text())
        if (saved.get('requested_model') != model or saved.get('tts_text') != tts_text
                or (saved.get('request_key') and saved['request_key'] != request_key)
                or (model != astra_probe.MODEL and not saved.get('request_key'))):
            raise pilot.PilotError('realtime_cache_request_mismatch')
        if saved['status'] == 'probing':
            raise pilot.PilotError('previous_astra_realtime_attempt_needs_review')
        return saved
    result = {'requested_model': model, 'interface': 'realtime', 'tts_text': tts_text, 'request_key': request_key,
              'maximum_responses': 1, 'attempted_responses': 0, 'audio_files_generated': 0,
              'status': 'probing', 'linguistic_certification': False, 'confidence': None}
    def finish(status):
        result['status'] = status
        pilot.atomic_json(path, result)
        return result
    key = os.environ.get('DARIJA_TTS_KEY') or os.environ.get('OPENAI_API_KEY')
    if not key:
        return finish('missing_api_key')
    pilot.atomic_json(path, result)
    socket = None
    chunks = bytearray()
    try:
        socket = connector(key) if connector else connect(key, model)
        deadline = time.monotonic() + 90
        for _ in range(2000):
            if time.monotonic() > deadline:
                return finish('response_outcome_uncertain')
            event = json.loads(socket.recv())
            kind = event.get('type')
            if kind == 'error':
                result['rejection'] = astra_probe.safe_error(None, json.dumps(event).encode())
                return finish('api_rejected')
            if kind == 'session.created':
                actual = event.get('session', {}).get('model', '')
                if not model_matches(actual, model):
                    return finish('returned_model_identity_mismatch')
                result['actual_model'] = actual
                socket.send(json.dumps({'type': 'session.update', 'session': {
                    'type': 'realtime', 'instructions': instructions,
                    'output_modalities': ['audio'], 'audio': {'output': {
                        'voice': 'cedar', 'format': {'type': 'audio/pcm', 'rate': 24000}}}}}))
            elif kind == 'session.updated' and result['attempted_responses'] == 0:
                socket.send(json.dumps({'type': 'conversation.item.create', 'item': {
                    'type': 'message', 'role': 'user', 'content': [{'type': 'input_text', 'text': tts_text}]}}))
                result['attempted_responses'] = 1
                pilot.atomic_json(path, result)
                socket.send(json.dumps({'type': 'response.create', 'response': {
                    'output_modalities': ['audio'], 'max_output_tokens': 1024}}))
            elif kind in {'response.output_audio.delta', 'response.audio.delta'}:
                chunks.extend(base64.b64decode(event['delta'], validate=True))
                if len(chunks) > 24000 * 2 * 20:
                    return finish('audio_duration_budget_exceeded')
            elif kind in {'response.output_audio_transcript.done', 'response.audio_transcript.done'}:
                result['generated_transcript'] = str(event.get('transcript', ''))[:2048]
            elif kind == 'response.done':
                response = event.get('response', {})
                result['response_status'] = response.get('status')
                if response.get('status') != 'completed' or not chunks:
                    error = response.get('status_details', {}).get('error', {}) if response.get('status_details') else {}
                    result['rejection'] = astra_probe.safe_error(None, json.dumps({'error': error}).encode())
                    return finish('response_without_usable_audio')
                raw = output / (prefix + '-raw.wav')
                with wave.open(str(raw), 'wb') as wav:
                    wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(24000); wav.writeframes(chunks)
                from quality import waveform_metrics, verify_encoded
                import numpy as np
                qa = waveform_metrics(np.frombuffer(chunks, dtype='<i2').astype(np.float32) / 32768, 24000, 'word')
                result['raw_quality'] = qa
                result['raw_sha256'] = pilot.file_sha256(raw)
                if not qa['passed']:
                    return finish('audio_returned_needs_technical_review')
                audio = output / (prefix + '.mp3')
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-map_metadata', '-1',
                    '-ac', '1', '-ar', '24000', '-af', 'volume=0.8', '-b:a', '64k', str(audio)], check=True, capture_output=True)
                result['quality'] = verify_encoded(audio, 'word')
                result['audio_sha256'] = pilot.file_sha256(audio)
                result['audio_file'] = audio.name
                result['raw_file'] = raw.name
                result['audio_files_generated'] = 1
                result['pronunciation_status'] = 'uncertain'
                return finish('audio_ready_for_pilot' if result['quality']['passed'] else 'audio_returned_needs_technical_review')
        return finish('event_budget_exceeded')
    except Rejection as exc:
        result['rejection'] = exc.diagnostic
        return finish('handshake_rejected')
    except Exception:
        return finish('connection_or_response_outcome_uncertain')
    finally:
        if socket is not None:
            try:
                socket.close()
            except Exception:
                pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=pilot.ROOT / 'artifacts/astra-probe')
    args = parser.parse_args()
    print(json.dumps(run(args.output), ensure_ascii=False, indent=2))
