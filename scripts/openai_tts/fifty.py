"""Comparatif de cinquante entrées : texte audio caché, 49 appels maximum."""
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
import phonetic_probe
from audio_texts import audio_catalog

CONFIG = pilot.ROOT / 'scripts/openai_tts/pilot-50.json'
PROFILE = 'consonant_symbols'
FOLDER = 'test-audio-openai-50'
INSTRUCTIONS = """Speak only Moroccan Darija with a natural Moroccan accent. Read the supplied Latin phonetic text exactly once, without introduction, explanation, spelling, symbol names, or translation. The input is not English or French. ʕ is the voiced pharyngeal consonant ayn; ħ is a voiceless pharyngeal consonant; ʔ is a glottal stop; q is a uvular stop, x is the sound kh, ɣ is gh, and ʃ is sh. Preserve doubled consonants as gemination, including qq, and preserve short vowels and consonant clusters. Say only the supplied Darija word or expression. The following French meaning is context only and must not be spoken: """


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def plan():
    config = json.loads(CONFIG.read_text())
    ids = config['entry_ids']
    if (len(ids) != 50 or len(set(ids)) != 50 or config['maximum_paid_requests'] != 49
            or config['profile'] != PROFILE or config['retained_entry_id'] != phonetic_probe.ENTRY_ID
            or config['model'] != phonetic_probe.MODEL or config['voice'] != 'cedar'):
        raise pilot.PilotError('invalid_fifty_budget_or_profile')
    catalog = pilot.read_catalog()
    texts = audio_catalog()['entries']
    preferred = next(r for r in phonetic_probe.plan()['records'] if r['profile'] == PROFILE)
    entries = []
    for entry_id in ids:
        entry = catalog[entry_id]
        audio_text = texts[entry_id]['audio_text'][PROFILE]
        if not audio_text or any(c.isdigit() for c in audio_text):
            raise pilot.PilotError('fifty_requires_digit_free_audio_text')
        request = {'model': config['model'], 'voice': 'cedar', 'input': audio_text,
                   'instructions': INSTRUCTIONS + entry['fr'], 'response_format': 'mp3', 'speed': 1.0}
        if entry_id == config['retained_entry_id']:
            request = preferred['request']
            if request['input'] != audio_text:
                raise pilot.PilotError('preferred_audio_text_changed')
        before = pilot.ROOT / 'public' / entry['audio']
        record = {**entry, 'request': request, 'key': digest({'request': request, 'profile': PROFILE, 'version': 1}),
                  'before_sha256': pilot.file_sha256(before)}
        if entry_id == config['retained_entry_id']:
            record['retained_sha256'] = config['retained_sha256']
        entries.append(record)
    if len({e['theme'] for e in entries}) != 31:
        raise pilot.PilotError('fifty_must_cover_31_themes')
    return {'version': 1, 'model': config['model'], 'voice': 'cedar', 'profile': PROFILE,
            'maximum_paid_requests': 49, 'source_script': 'latin', 'complete_ipa': False,
            'linguistic_certification': False, 'confidence': None,
            'baseline_test_id': config['baseline_test_id'], 'entries': entries}


def batches(spec):
    # Reuse the existing, bounded ten-entry generator without increasing its limit.
    for index in range(5):
        yield index, {**spec, 'entries': spec['entries'][index * 10:(index + 1) * 10]}


def seed_preferred(baseline, output, spec):
    from quality import verify_encoded
    config = json.loads(CONFIG.read_text())
    source_spec = json.loads((baseline / 'manifest.json').read_text())
    preferred = next(r for r in source_spec['records'] if r['profile'] == PROFILE)
    entry = next(e for e in spec['entries'] if e['entry_id'] == config['retained_entry_id'])
    source = (baseline / preferred['audio']).resolve()
    if (source_spec['test_id'] != spec['baseline_test_id'] or source_spec['model'] != spec['model']
            or source_spec['voice'] != spec['voice'] or source_spec['latin'] != entry['latin']
            or preferred['request'] != entry['request'] or baseline.resolve() not in source.parents
            or preferred['sha256'] != entry['retained_sha256']
            or pilot.file_sha256(source) != entry['retained_sha256']):
        raise pilot.PilotError('fifty_preferred_baseline_mismatch')
    qa = verify_encoded(source, 'word')
    if not qa['passed']:
        raise pilot.PilotError('fifty_preferred_technical_failure')
    index = next(i for i, batch in batches(spec) if entry in batch['entries'])
    reports = output / f'batch-{index}'
    stem = f"{entry['entry_id']}-{entry['key'][:12]}"
    record_path = reports / 'records' / (stem + '.json')
    if record_path.exists():
        saved = json.loads(record_path.read_text())
        if saved.get('mp3_sha256') != entry['retained_sha256']:
            raise pilot.PilotError('fifty_preferred_cache_mismatch')
        return  # Existing generator checks actual raw/export integrity.
    for folder in ['raw', 'audio']:
        path = reports / folder / (stem + '.mp3')
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, path)
    pilot.atomic_json(record_path, {'entry_id': entry['entry_id'], 'key': entry['key'],
        'latin': entry['latin'], 'prompt': entry['request']['input'], 'model': spec['model'], 'voice': spec['voice'],
        'source_script': 'latin', 'technical_status': 'passed', 'pronunciation_status': 'uncertain', 'confidence': None,
        'raw_origin': 'technically_checked_review_mp3', 'raw_sha256': entry['retained_sha256'], 'raw_quality': qa,
        'mp3': f'audio/{stem}.mp3', 'mp3_sha256': entry['retained_sha256'], 'encoded_quality': qa,
        'instructions': entry['request']['instructions'], 'imported_from_review': spec['baseline_test_id'],
        'api_synthesized': False})


def generate(output, baseline):
    output = pilot.output_path(output)
    spec = plan()
    pilot.atomic_json(output / 'plan.json', spec)
    try:
        seed_preferred(baseline, output, spec)
        for index, batch in batches(spec):
            new_ids = {e['entry_id'] for e in batch['entries'] if not e.get('retained_sha256')}
            pilot.generate(output / f'batch-{index}', pilot_plan=batch,
                           new_entry_ids=new_ids, max_new_requests=len(new_ids))
        pilot.atomic_json(output / 'status.json', {'status': 'ready', 'entries': 50, 'maximum_paid_requests': 49,
            'new_candidates': 49, 'retained_candidates': 1, 'profile': PROFILE, 'linguistic_certification': False})
    except pilot.PilotError as exc:
        ready = sum(json.loads(p.read_text()).get('technical_status') == 'passed'
                    for p in output.glob('batch-*/records/*.json'))
        pilot.atomic_json(output / 'status.json', {'status': 'blocked', 'error': exc.code,
            'provider_error_code': exc.provider_code, 'technically_ready': ready, 'expected': 50,
            'maximum_paid_requests': 49, 'linguistic_certification': False})
        raise


def build(output, site):
    spec = plan()
    entries = []
    for index, batch in batches(spec):
        temporary = output / f'review-{index}'
        manifest = pilot.build_review(output / f'batch-{index}', temporary, pilot_plan=batch)
        for entry in manifest['entries']:
            for side in ['before', 'after']:
                target = site / entry[side]
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(temporary / entry[side], target)
            entry['profile'] = PROFILE
            entry['retained_from_probe'] = entry['id'] == phonetic_probe.ENTRY_ID
            entries.append(entry)
    manifest = {k: v for k, v in spec.items() if k != 'entries'}
    manifest.update(count=50, entries=entries, themes=manifest_themes(), production_voice='Jamal')
    manifest['review_id'] = digest(manifest)
    templates = pilot.ROOT / 'scripts/hadra/review-site'
    page = (templates / 'index.html').read_text().replace('HADRA', 'OpenAI')
    page = page.replace('OpenAI lisant le latin', 'OpenAI lisant le texte phonétique caché')
    page = page.replace('OpenAI lit le latin, avec les chiffres 3, 7 et 9.',
        'Une voix générée par OpenAI/Cedar lit une notation consonantique sans chiffres-sons. Le latin affiché est conservé. Ce n’est pas de l’IPA complet ; we99e3 reprend à l’identique l’audio que vous avez préféré.')
    page = page.replace('OpenAI · lecture du latin', 'OpenAI · Cedar · symboles consonantiques')
    page = page.replace('Je valide la nouvelle voix', 'Je valide ce test').replace('Je refuse le déploiement', 'Je refuse cette voix')
    page = page.replace('Vos avis restent dans ce navigateur.', 'Aucun avis ne déclenche de déploiement automatique. Vos avis restent dans ce navigateur.')
    js = (templates / 'review.js').read_text().replace('HADRA_REVIEW', 'OPENAI_FIFTY_REVIEW')
    js = js.replace('darija-hadra-review-', 'darija-openai-fifty-review-').replace('avis-hadra-50-mots.json', 'avis-openai-50-mots.json')
    js = js.replace('id: entry.id, latin: entry.latin, after_sha256: entry.after_sha256,',
                    'id: entry.id, latin: entry.latin, tts_text: entry.tts_text, profile: entry.profile, after_sha256: entry.after_sha256,')
    (site / 'index.html').write_text(page)
    (site / 'review.js').write_text(js)
    shutil.copyfile(templates / 'review.css', site / 'review.css')
    pilot.atomic_json(site / 'manifest.json', manifest)
    (site / 'data.js').write_text('window.OPENAI_FIFTY_REVIEW = ' + json.dumps(manifest, ensure_ascii=False).replace('<', '\\u003c') + ';\n')
    verify(site, pilot.ROOT)
    pilot.atomic_json(output / 'review-queue.json', {'review_id': manifest['review_id'], 'linguistic_certification': False,
        'entries': [{'id': e['id'], 'tts_text': e['tts_text'], 'warnings': e['warnings'],
                     'pronunciation_status': 'uncertain', 'confidence': None} for e in entries]})
    return manifest


def manifest_themes():
    return dict(re.findall(r"id: '([^']+)', titre: '([^']+)'", (pilot.ROOT / 'src/data/themes.ts').read_text()))


def verify(site, checkout):
    spec = plan()
    manifest = json.loads((site / 'manifest.json').read_text())
    expected = {e['entry_id']: e for e in spec['entries']}
    catalog = pilot.read_catalog(checkout)
    if (manifest['count'] != 50 or len(manifest['entries']) != 50
            or {e['id'] for e in manifest['entries']} != set(expected)
            or manifest['model'] != spec['model'] or manifest['voice'] != 'cedar'
            or manifest['profile'] != PROFILE or manifest['linguistic_certification'] is not False
            or manifest['complete_ipa'] is not False):
        raise pilot.PilotError('fifty_manifest_mismatch')
    for entry in manifest['entries']:
        current, planned = catalog[entry['id']], expected[entry['id']]
        if (entry['latin'] != current['latin'] or entry['tts_text'] != planned['request']['input']
                or entry['instructions'] != planned['request']['instructions']
                or entry['before_sha256'] != pilot.file_sha256(checkout / 'public' / current['audio'])
                or entry['technical_status'] != 'passed' or entry['pronunciation_status'] != 'uncertain'
                or entry['confidence'] is not None):
            raise pilot.PilotError('fifty_source_or_validation_mismatch')
        if planned.get('retained_sha256') and entry['after_sha256'] != planned['retained_sha256']:
            raise pilot.PilotError('fifty_preferred_audio_modified')
        for side in ['before', 'after']:
            path = (site / entry[side]).resolve()
            if site.resolve() not in path.parents or pilot.file_sha256(path) != entry[side + '_sha256']:
                raise pilot.PilotError('fifty_audio_integrity_failed')
    return manifest


def publish(site, checkout):
    memory = (checkout / 'CLAUDE.md').read_text()  # Complete project memory before publication.
    verify(site, checkout)
    destination = checkout / 'public' / FOLDER
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(site, destination)
    note = '- Test OpenAI de 50 entrées demandé et généré (2026-10-15) : `/test-audio-openai-50/`, Cedar avec texte consonantique caché sans chiffres-sons ; 49 nouveaux MP3 et weqqeʕ préféré conservé à l’identique, 50 MP3 Jamal avant. Avis locaux et export ; prononciation à évaluer, aucune activation dans les exercices ni génération massive.'
    if note not in memory:
        memory = memory.replace('## Points en suspens\n', '## Points en suspens\n\n' + note + '\n', 1)
        if len(memory.splitlines()) >= 300 or len(memory) >= 45000:
            raise pilot.PilotError('memory_too_long')
        (checkout / 'CLAUDE.md').write_text(memory)
    history = checkout / 'docs/historique.md'
    text = history.read_text()
    row = '| 2026-10-15 | Comparatif OpenAI de 50 entrées avec notation cachée, 49 nouveaux fichiers et candidat préféré conservé ; 100 MP3 avant/après, avis locaux et export | `public/test-audio-openai-50/` |\n'
    if row not in text:
        history.write_text(text.replace('## Décisions', row + '\n## Décisions', 1))
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=checkout, text=True).strip()
    git('config', 'user.name', 'github-actions[bot]')
    git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
    git('add', 'public/' + FOLDER, 'CLAUDE.md', 'docs/historique.md')
    paths = git('diff', '--cached', '--name-only').splitlines()
    if any(p not in {'CLAUDE.md', 'docs/historique.md'} and not p.startswith('public/' + FOLDER + '/') for p in paths):
        raise pilot.PilotError('unexpected_fifty_publication_changes')
    if paths:
        git('commit', '-m', 'test: publie cinquante comparaisons avec texte audio phonétique caché')
        for attempt in range(4):
            verify(site, checkout)
            result = subprocess.run(['git', 'push', 'origin', 'HEAD:main'], cwd=checkout, capture_output=True, text=True)
            if result.returncode == 0:
                break
            if 'non-fast-forward' in result.stderr or 'fetch first' in result.stderr:
                git('fetch', 'origin', 'main'); git('rebase', 'FETCH_HEAD')
                (checkout / 'CLAUDE.md').read_text()
        else:
            raise pilot.PilotError('fifty_publication_push_failed')
    subprocess.run(['gh', 'api', '--method', 'POST', 'repos/mcofirty/Darijapp/actions/workflows/publier.yml/dispatches', '-f', 'ref=main'], check=True)


def check_http(site, output):
    expected = json.loads((site / 'manifest.json').read_text())
    url = 'https://mcofirty.github.io/Darijapp/' + FOLDER + '/'
    def read(path):
        with urllib.request.urlopen(url + path, timeout=30) as response:
            return response.read()
    for attempt in range(75):
        try:
            served = json.loads(read('manifest.json'))
            if served != expected:
                raise pilot.PilotError('fifty_http_manifest_not_current')
            break
        except Exception:
            if attempt == 74:
                raise
            time.sleep(10)
    for entry in expected['entries']:
        for side in ['before', 'after']:
            if hashlib.sha256(read(entry[side])).hexdigest() != entry[side + '_sha256']:
                raise pilot.PilotError('fifty_http_audio_mismatch')
    for asset in ['index.html', 'review.css', 'review.js', 'data.js']:
        if read(asset) != (site / asset).read_bytes():
            raise pilot.PilotError('fifty_http_asset_mismatch')
    result = {'url': url, 'review_id': expected['review_id'], 'status': 'passed',
              'entries': 50, 'audio_files_checked': 100, 'linguistic_certification': False}
    pilot.atomic_json(output / 'http-check.json', result)
    print('Page, ressources et cent MP3 servis vérifiés', flush=True)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['plan', 'generate', 'build', 'publish', 'check'])
    parser.add_argument('--output', type=Path, default=pilot.ROOT / 'artifacts/openai-fifty')
    parser.add_argument('--site', type=Path, default=pilot.ROOT / 'artifacts/openai-fifty-site')
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--checkout', type=Path)
    args = parser.parse_args()
    if args.command == 'plan':
        print(json.dumps(plan(), ensure_ascii=False, indent=2))
    elif args.command == 'generate':
        generate(args.output, args.baseline)
    elif args.command == 'build':
        build(args.output, args.site)
    elif args.command == 'check':
        check_http(args.site, args.output)
    else:
        publish(args.site.resolve(), args.checkout.resolve())
