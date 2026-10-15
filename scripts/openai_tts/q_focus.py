"""Cinq mots avec 9, deux variantes Realtime ; aucun remplacement des exercices."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

import pilot
import three_voices as three
from audio_texts import audio_catalog

SPEC = pilot.ROOT / 'scripts/openai_tts/q-focus.json'
FOLDER = 'test-audio-son-9'
LABELS = ['jamal', 'baseline', 'a', 'b']
VARIANTS = {
    'a': "Speak only the supplied Moroccan Darija word once, naturally, without any introduction or explanation. The input is a Latin phonetic cue, never an English word or letter name. Produce q as the Arabic qaf /q/: a voiceless UVULAR stop, made by the back of the tongue contacting the uvula, farther back than /k/. Keep a complete closure and a single clean release. Never substitute /k/, /g/, /t/, a glottal stop, or a spoken letter name. For qq, hold the closure longer and release once; do not insert a vowel between the consonants. The symbols ʕ, ħ, x, ɣ and ʃ denote ayn, haa, kh, gh and sh. Preserve the supplied vowels, final consonants and Moroccan rhythm; no spelling, exaggeration or extra syllable.",
    'b': "Prononce uniquement le mot fourni, une seule fois, en darija marocaine naturelle. Le texte est une aide phonétique latine expérimentale. Le signe ḳ représente exactement le qaf arabe ق, /q/, une occlusive uvulaire sourde : ferme avec le dos de la langue très en arrière, au niveau de la luette, puis relâche. Ne remplace pas ce son par k, g, t ou une coupure glottale. Ce signe ne se lit jamais comme le nom d'une lettre. Deux ḳ successifs indiquent une fermeture prolongée suivie d'un seul relâchement, sans voyelle ajoutée. ʕ désigne le ayn, ħ le haa, x le kh, ɣ le gh, ʃ le ch. Garde les voyelles fournies et le rythme marocain. Aucune explication, traduction, épellation ou syllabe supplémentaire."
}


def checked_path(root, relative, expected):
    path = (root / relative).resolve()
    if root.resolve() not in path.parents or pilot.file_sha256(path) != expected:
        raise pilot.PilotError('q_focus_baseline_integrity_failed')
    return path


def plan(baseline):
    config = json.loads(SPEC.read_text())
    if (config['model'] != 'gpt-realtime-2.1' or config['voice'] != 'cedar'
            or config['maximum_new_responses'] != 10 or len(config['entry_ids']) != 5
            or len(set(config['entry_ids'])) != 5):
        raise pilot.PilotError('q_focus_invalid_budget_or_model')
    fifty_root = baseline / 'test-audio-openai-50'
    three_root = baseline / 'test-audio-trois-voix'
    fifty = json.loads((fifty_root / 'manifest.json').read_text())
    prior = json.loads((three_root / 'manifest.json').read_text())
    if fifty['review_id'] != config['fifty_review_id'] or prior['review_id'] != config['three_review_id']:
        raise pilot.PilotError('q_focus_wrong_baseline')
    originals = {e['id']: e for e in fifty['entries']}
    previous = {e['id']: e for e in prior['entries']}
    current, texts = pilot.read_catalog(), audio_catalog()['entries']
    entries = []
    for entry_id in config['entry_ids']:
        old = originals[entry_id]
        text = texts[entry_id]['audio_text']['consonant_symbols']
        if (old['latin'] != current[entry_id]['latin'] or old['arabe'] != current[entry_id]['arabe']
                or old['tts_text'] != text or '9' not in old['latin'] or 'q' not in text
                or any(c.isdigit() or '\u0600' <= c <= '\u06ff' for c in text)):
            raise pilot.PilotError('q_focus_source_changed')
        source = previous.get(entry_id)
        baseline_model = prior['models']['new'] if source else fifty['model']
        baseline_root = three_root if source else fifty_root
        before_path = source['new'] if source else old['after']
        before_sha = source['new_sha256'] if source else old['after_sha256']
        checked_path(fifty_root, old['before'], old['before_sha256'])
        checked_path(baseline_root, before_path, before_sha)
        entry = {k: old[k] for k in ['id', 'latin', 'arabe', 'fr', 'theme']}
        entry.update(jamal_source='test-audio-openai-50/' + old['before'],
            jamal_sha256=old['before_sha256'], baseline_source=str(baseline_root.relative_to(baseline)) + '/' + before_path,
            baseline_sha256=before_sha, baseline_model=baseline_model, candidates={})
        for label, instructions in VARIANTS.items():
            tts_text = text if label == 'a' else text.replace('q', 'ḳ')
            instructions += ' Meaning for context only, do not speak it: ' + old['fr']
            request_key = three.realtime.request_identity(config['model'], tts_text, instructions)
            entry['candidates'][label] = {'id': entry_id + '-' + label, 'tts_text': tts_text,
                'instructions': instructions, 'key': request_key}
        entries.append(entry)
    return {'version': 1, 'model': config['model'], 'voice': 'cedar', 'count': 5,
        'maximum_new_responses': 10, 'source_script': 'latin', 'complete_ipa': False,
        'linguistic_certification': False, 'confidence': None, 'entries': entries}


def generate(output, baseline):
    output = pilot.output_path(output)
    spec = plan(baseline)
    saved = output / 'plan.json'
    if saved.exists() and json.loads(saved.read_text()) != spec:
        raise pilot.PilotError('q_focus_previous_plan_requires_review')
    pilot.atomic_json(saved, spec)
    ready = 0
    try:
        for entry in spec['entries']:
            for label, candidate in entry['candidates'].items():
                result = three.realtime.run(three.record_dir(output, candidate), model=spec['model'],
                    tts_text=candidate['tts_text'], instructions=candidate['instructions'])
                if result['status'] != 'audio_ready_for_pilot':
                    pilot.atomic_json(output / 'status.json', {'status': 'blocked', 'entry_id': entry['id'],
                        'variant': label, 'technically_ready': ready, 'expected': 10,
                        'maximum_new_responses': 10, 'realtime_result': result, 'linguistic_certification': False})
                    raise pilot.PilotError('q_focus_generation_blocked')
                three.checked_record(output, candidate)
                ready += 1
                print(candidate['id'] + ': candidat réel techniquement conforme, son 9 à écouter', flush=True)
        pilot.atomic_json(output / 'status.json', {'status': 'ready', 'model': spec['model'], 'voice': 'cedar',
            'entries': 5, 'new_candidates': 10, 'retained_audio_files': 10, 'maximum_new_responses': 10,
            'linguistic_certification': False, 'pronunciation_status': 'uncertain', 'confidence': None})
    except pilot.PilotError as exc:
        path = output / 'status.json'
        if not path.exists() or json.loads(path.read_text())['status'] != 'blocked':
            pilot.atomic_json(path, {'status': 'blocked', 'technically_ready': ready, 'error': exc.code,
                'maximum_new_responses': 10, 'linguistic_certification': False})
        raise


def build(output, baseline, site):
    spec = plan(baseline)
    entries = []
    for entry in spec['entries']:
        item = {k: v for k, v in entry.items() if k not in {'jamal_source', 'baseline_source', 'candidates'}}
        item.update(candidates={}, warnings=[], pronunciation_status='uncertain', confidence=None)
        for label in LABELS:
            if label in {'a', 'b'}:
                candidate = entry['candidates'][label]
                record = three.checked_record(output, candidate)
                source = three.record_dir(output, candidate) / record['audio_file']
                warnings = sorted(set(record['raw_quality']['warnings'] + record['quality']['warnings']))
                item['candidates'][label] = {**candidate, 'actual_model': record['actual_model'],
                    'technical_status': 'passed', 'warnings': warnings,
                    'generated_transcript_not_independent_validation': record.get('generated_transcript')}
                item['warnings'] += warnings
                item[label + '_sha256'] = record['audio_sha256']
            else:
                source = checked_path(baseline, entry[label + '_source'], entry[label + '_sha256'])
            relative = label + '/' + entry['id'] + '.mp3'
            target = site / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            item[label] = relative
        item['warnings'] = sorted(set(item['warnings']))
        entries.append(item)
    manifest = {k: v for k, v in spec.items() if k != 'entries'}
    manifest.update(entries=entries, themes=dict(re.findall(r"id: '([^']+)', titre: '([^']+)'",
        (pilot.ROOT / 'src/data/themes.ts').read_text())))
    manifest['review_id'] = three.digest(manifest)
    templates = pilot.ROOT / 'scripts/openai_tts/q-review-site'
    for asset in ['index.html', 'review.js']:
        shutil.copyfile(templates / asset, site / asset)
    shutil.copyfile(pilot.ROOT / 'scripts/hadra/review-site/review.css', site / 'review.css')
    with (site / 'review.css').open('a') as css:
        css.write('\n.votes{grid-template-columns:repeat(2,minmax(0,1fr))}\n')
    pilot.atomic_json(site / 'manifest.json', manifest)
    (site / 'data.js').write_text('window.Q_REVIEW = ' + json.dumps(manifest, ensure_ascii=False).replace('<', '\\u003c') + ';\n')
    verify(site, pilot.ROOT, baseline)
    pilot.atomic_json(output / 'review-queue.json', {'review_id': manifest['review_id'],
        'linguistic_certification': False, 'entries': [{k: e[k] for k in
            ['id', 'latin', 'warnings', 'pronunciation_status', 'confidence']} for e in entries]})
    return manifest


def verify(site, checkout, baseline):
    spec, catalog = plan(baseline), pilot.read_catalog(checkout)
    manifest = json.loads((site / 'manifest.json').read_text())
    expected = {e['id']: e for e in spec['entries']}
    if (manifest['count'] != 5 or len(manifest['entries']) != 5
            or {e['id'] for e in manifest['entries']} != set(expected)
            or manifest['model'] != spec['model'] or manifest['voice'] != 'cedar'
            or manifest['linguistic_certification'] is not False or manifest['confidence'] is not None
            or manifest['review_id'] != three.digest({k: v for k, v in manifest.items() if k != 'review_id'})):
        raise pilot.PilotError('q_focus_manifest_mismatch')
    for entry in manifest['entries']:
        source, current = expected[entry['id']], catalog[entry['id']]
        if (entry['latin'] != current['latin'] or entry['arabe'] != current['arabe']
                or entry['jamal_sha256'] != pilot.file_sha256(checkout / 'public' / current['audio'])
                or entry['jamal_sha256'] != source['jamal_sha256']
                or entry['baseline_sha256'] != source['baseline_sha256'] or entry['baseline_model'] != source['baseline_model']
                or entry['pronunciation_status'] != 'uncertain' or entry['confidence'] is not None):
            raise pilot.PilotError('q_focus_source_or_status_mismatch')
        for label in ['a', 'b']:
            candidate = entry['candidates'][label]
            if (any(candidate[k] != source['candidates'][label][k] for k in ['id', 'key', 'tts_text', 'instructions'])
                    or not three.realtime.model_matches(candidate['actual_model'], spec['model'])
                    or candidate['technical_status'] != 'passed'):
                raise pilot.PilotError('q_focus_candidate_mismatch')
        for label in LABELS:
            checked_path(site, entry[label], entry[label + '_sha256'])
    return manifest


def publish(site, checkout, baseline):
    memory = (checkout / 'CLAUDE.md').read_text()
    verify(site, checkout, baseline)
    target = checkout / 'public' / FOLDER
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(site, target)
    note = '- Son 9 (2026-10-15) : `/test-audio-son-9/`, cinq mots, deux nouveaux candidats Realtime/Cedar par mot ; Jamal et OpenAI précédent conservés, vingt MP3. Contrôles techniques distincts de la prononciation, avis attendu, exercices inchangés.'
    if note not in memory:
        memory = memory.replace('## Points en suspens\n', '## Points en suspens\n\n' + note + '\n', 1)
        if len(memory.splitlines()) >= 300 or len(memory) >= 45000:
            raise pilot.PilotError('memory_too_long')
        (checkout / 'CLAUDE.md').write_text(memory)
    history = checkout / 'docs/historique.md'
    row = '| 2026-10-15 | Test ciblé du son 9 : cinq mots, dix nouveaux candidats Realtime et dix audios précédents conservés ; comparatif à quatre lecteurs sans activation | `public/test-audio-son-9/` |\n'
    text = history.read_text()
    if row not in text:
        history.write_text(text.replace('## Décisions', row + '\n## Décisions', 1))
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=checkout, text=True).strip()
    git('config', 'user.name', 'github-actions[bot]')
    git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
    git('add', 'public/' + FOLDER, 'CLAUDE.md', 'docs/historique.md')
    paths = git('diff', '--cached', '--name-only').splitlines()
    if any(p not in {'CLAUDE.md', 'docs/historique.md'} and not p.startswith('public/' + FOLDER + '/') for p in paths):
        raise pilot.PilotError('unexpected_q_focus_publication_changes')
    if paths:
        git('commit', '-m', 'test: publie les variantes ciblées du son 9 sur cinq mots')
        for _ in range(4):
            (checkout / 'CLAUDE.md').read_text()
            verify(site, checkout, baseline)
            result = subprocess.run(['git', 'push', 'origin', 'HEAD:main'], cwd=checkout, capture_output=True, text=True)
            if result.returncode == 0:
                break
            if 'non-fast-forward' in result.stderr or 'fetch first' in result.stderr:
                git('fetch', 'origin', 'main')
                git('rebase', 'FETCH_HEAD')
        else:
            raise pilot.PilotError('q_focus_push_failed')
    subprocess.run(['gh', 'api', '--method', 'POST',
        'repos/mcofirty/Darijapp/actions/workflows/publier.yml/dispatches', '-f', 'ref=main'], check=True)


def check_http(site, output):
    expected = json.loads((site / 'manifest.json').read_text())
    url = 'https://mcofirty.github.io/Darijapp/' + FOLDER + '/'
    def read(path):
        with urllib.request.urlopen(url + path, timeout=30) as response:
            return response.read()
    for attempt in range(75):
        try:
            if json.loads(read('manifest.json')) != expected:
                raise pilot.PilotError('q_focus_http_stale_manifest')
            break
        except Exception:
            if attempt == 74:
                raise
            time.sleep(10)
    for entry in expected['entries']:
        for label in LABELS:
            if hashlib.sha256(read(entry[label])).hexdigest() != entry[label + '_sha256']:
                raise pilot.PilotError('q_focus_http_audio_mismatch')
    for asset in ['index.html', 'review.css', 'review.js', 'data.js']:
        if read(asset) != (site / asset).read_bytes():
            raise pilot.PilotError('q_focus_http_asset_mismatch')
    result = {'url': url, 'review_id': expected['review_id'], 'status': 'passed',
        'entries': 5, 'audio_files_checked': 20, 'linguistic_certification': False}
    pilot.atomic_json(output / 'http-check.json', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['generate', 'build', 'publish', 'check'])
    parser.add_argument('--output', type=Path, default=pilot.ROOT / 'artifacts/q-focus')
    parser.add_argument('--site', type=Path, default=pilot.ROOT / 'artifacts/q-focus-site')
    parser.add_argument('--baseline', type=Path, required=True)
    parser.add_argument('--checkout', type=Path)
    args = parser.parse_args()
    if args.command == 'generate':
        generate(args.output, args.baseline)
    elif args.command == 'build':
        build(args.output, args.baseline, args.site)
    elif args.command == 'publish':
        publish(args.site.resolve(), args.checkout.resolve(), args.baseline)
    else:
        check_http(args.site, args.output)
