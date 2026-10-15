"""Teste réellement les sorties audio d’Astra, sans substitution de modèle."""
import argparse
import base64
import hashlib
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

import pilot
import phonetic_probe

MODEL = 'gpt-6-astra'
BASE = 'https://api.openai.com/v1/'
MAX_POSTS = 2
SAFE_CODES = {'invalid_value', 'unsupported_value', 'unsupported_parameter', 'unsupported_model',
              'model_not_supported', 'model_not_found', 'invalid_model', 'invalid_request_error',
              'invalid_api_key', 'insufficient_quota', 'rate_limit_exceeded', 'permission_denied',
              'billing_hard_limit_reached', 'billing_not_active', 'access_denied'}


def safe_error(status, data):
    """Only categorical diagnostics; never persist provider messages/headers."""
    try:
        error = json.loads(data).get('error', {})
    except (ValueError, AttributeError):
        error = {}
    if not isinstance(error, dict):
        error = {}
    code = next((error.get(k) for k in ['code', 'type'] if error.get(k) in SAFE_CODES), None)
    param = error.get('param')
    if not isinstance(param, str) or not re.fullmatch(r'[A-Za-z_.\[\]0-9-]{1,60}', param):
        param = None
    message = str(error.get('message', '')).lower()
    unsupported = any(s in message for s in ['not support', 'unsupported', 'only support', 'not available', 'does not exist'])
    return {'http_status': status, 'provider_code': code, 'parameter': param,
            'mentions_audio_limitation': unsupported and any(s in message for s in ['audio', 'modalit', 'speech']),
            'mentions_model_limitation': unsupported and 'model' in message}


def request(route, payload, key):
    if route not in {'models/' + MODEL, 'audio/speech', 'chat/completions'}:
        raise pilot.PilotError('unapproved_astra_probe_endpoint')
    req = urllib.request.Request(BASE + route, data=None if payload is None else json.dumps(payload).encode(),
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
        method='GET' if payload is None else 'POST')
    try:
        with urllib.request.build_opener(pilot.NoRedirect).open(req, timeout=90) as response:
            data = response.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            return {'http_status': 200, 'invalid_response_size': True}
        return {'http_status': 200, 'data': data}
    except urllib.error.HTTPError as exc:
        return safe_error(exc.code, exc.read(4096))
    except (urllib.error.URLError, TimeoutError, OSError):
        return {'http_status': None, 'transport_outcome_uncertain': True}


def payloads():
    sample = next(r for r in phonetic_probe.plan()['records'] if r['profile'] == 'consonant_symbols')
    speech = {**sample['request'], 'model': MODEL}
    chat = {'model': MODEL, 'modalities': ['text', 'audio'], 'audio': {'voice': 'cedar', 'format': 'mp3'},
            'max_completion_tokens': 2048,
            'messages': [{'role': 'system', 'content': sample['request']['instructions']},
                         {'role': 'user', 'content': sample['request']['input']}]}
    return [('audio/speech', speech), ('chat/completions', chat)]


def parse_audio(route, data):
    if route == 'audio/speech':
        return data, None
    response = json.loads(data)
    actual = response.get('model', '')
    if not actual.startswith(MODEL):
        raise pilot.PilotError('astra_returned_model_identity_mismatch')
    audio = response['choices'][0]['message'].get('audio')
    if not audio or not isinstance(audio.get('data'), str):
        raise pilot.PilotError('astra_response_contains_no_audio')
    return base64.b64decode(audio['data'], validate=True), actual


def run(output):
    output = pilot.output_path(output)
    result_path = output / 'status.json'
    if result_path.exists():
        previous = json.loads(result_path.read_text())
        if previous['status'] != 'probing':
            return previous  # No automatic replay, including rejected capability probes.
        raise pilot.PilotError('previous_astra_attempt_requires_review')
    key = os.environ.get('DARIJA_TTS_KEY') or os.environ.get('OPENAI_API_KEY')
    result = {'requested_model': MODEL, 'entry_id': 'verbes-085', 'latin': 'we99e3', 'tts_text': 'weqqeʕ',
              'voice_requested': 'cedar', 'maximum_generation_requests': MAX_POSTS,
              'attempted_generation_requests': 0, 'audio_files_generated': 0,
              'status': 'probing', 'model_visible': None, 'endpoints': [],
              'linguistic_certification': False, 'confidence': None, 'production_voice': 'Jamal'}
    def finish(status):
        result['status'] = status
        pilot.atomic_json(result_path, result)
        return result
    if not key:
        return finish('missing_api_key')
    pilot.atomic_json(result_path, result)
    lookup = request('models/' + MODEL, None, key)
    result['model_lookup'] = {k: v for k, v in lookup.items() if k != 'data'}
    if lookup['http_status'] == 200 and 'data' in lookup:
        try:
            result['model_visible'] = json.loads(lookup['data']).get('id') == MODEL
        except ValueError:
            return finish('invalid_model_lookup_response')
    elif lookup['http_status'] == 404:
        result['model_visible'] = False
    elif lookup['http_status'] in {401, 403, 429} or lookup.get('transport_outcome_uncertain'):
        return finish('model_access_check_blocked')
    for index, (route, payload) in enumerate(payloads()):
        result['attempted_generation_requests'] += 1
        if result['attempted_generation_requests'] > MAX_POSTS:
            raise pilot.PilotError('astra_probe_budget_exceeded')
        report = {'endpoint': route, 'requested_model': MODEL,
                  'request_sha256': hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest(),
                  'status': 'pending'}
        result['endpoints'].append(report)
        pilot.atomic_json(output / f'request-{index}.json', payload)  # Public text only, never credentials.
        pilot.atomic_json(result_path, result)  # Persist before API call: timeouts must not be retried.
        response = request(route, payload, key)
        report.update({k: v for k, v in response.items() if k != 'data'})
        if response['http_status'] != 200:
            report['status'] = 'rejected' if response['http_status'] in {400, 401, 403, 404, 422, 429} else 'uncertain'
            if response['http_status'] in {400, 404, 422}:
                pilot.atomic_json(result_path, result)
                continue  # A distinct API interface, only after a definite rejection.
            return finish('api_rejected' if report['status'] == 'rejected' else 'request_outcome_uncertain')
        report['status'] = 'accepted'
        try:
            audio, actual_model = parse_audio(route, response['data'])
            if not audio or len(audio) > 4 * 1024 * 1024:
                return finish('invalid_audio_response_size')
            raw = output / 'astra-raw.mp3'
            raw.write_bytes(audio)
            result['audio_files_generated'] = 1
            result['raw_sha256'] = pilot.file_sha256(raw)
            report['actual_model_echoed'] = actual_model
            from quality import verify_encoded
            qa = verify_encoded(raw, 'word')
            result.update(quality=qa, pronunciation_status='uncertain')
            return finish('audio_ready_for_pilot' if qa['passed'] else 'audio_returned_needs_technical_review')
        except pilot.PilotError as exc:
            result['error'] = exc.code
            return finish('accepted_without_usable_audio')
        except Exception:
            return finish('accepted_response_needs_technical_review')
    return finish('audio_not_available_on_tested_endpoints')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=pilot.ROOT / 'artifacts/astra-probe')
    args = parser.parse_args()
    print(json.dumps(run(args.output), ensure_ascii=False, indent=2))
