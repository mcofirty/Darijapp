"""Dix entrées, trois écoutes ; seuls dix nouveaux rendus Realtime sont générés."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

import astra_realtime_probe as realtime
import pilot
from audio_texts import audio_catalog

SPEC = pilot.ROOT / 'scripts/openai_tts/three-voices.json'
FOLDER = 'test-audio-trois-voix'


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def plan(baseline):
    config = json.loads(SPEC.read_text())
    if (config['model'] != 'gpt-realtime-2.1' or config['voice'] != 'cedar'
            or len(config['entry_ids']) != 10 or len(set(config['entry_ids'])) != 10
            or config['maximum_new_responses'] != 10):
        raise pilot.PilotError('three_voice_invalid_budget_or_model')
    source = json.loads((baseline / 'manifest.json').read_text())
    if (source['review_id'] != config['baseline_review_id']
            or source['model'] != 'gpt-4o-mini-tts-2025-12-15' or source['voice'] != 'cedar'):
        raise pilot.PilotError('three_voice_wrong_baseline')
    current = pilot.read_catalog()
    texts = audio_catalog()['entries']
    originals = {e['id']: e for e in source['entries']}
    entries = []
    for entry_id in config['entry_ids']:
        old = originals[entry_id]
        if (old['latin'] != current[entry_id]['latin']
                or old['tts_text'] != texts[entry_id]['audio_text']['consonant_symbols']
                or any(c.isdigit() for c in old['tts_text'])):
            raise pilot.PilotError('three_voice_source_changed')
        for side in ['before', 'after']:
            path = (baseline / old[side]).resolve()
            if baseline.resolve() not in path.parents or pilot.file_sha256(path) != old[side + '_sha256']:
                raise pilot.PilotError('three_voice_baseline_integrity_failed')
        entry = {k: old[k] for k in ['id', 'latin', 'arabe', 'fr', 'theme', 'tts_text', 'instructions']}
        entry.update(jamal_source=old['before'], previous_source=old['after'],
                     jamal_sha256=old['before_sha256'], previous_sha256=old['after_sha256'],
                     previous_warnings=old['warnings'])
        entry['key'] = digest({'model': config['model'], 'voice': 'cedar', 'input': old['tts_text'],
                               'instructions': old['instructions'], 'format': 'pcm24000_to_mp3_64k_v1'})
        entries.append(entry)
    return {'version': 1, 'model': config['model'], 'voice': 'cedar', 'count': 10,
            'maximum_new_responses': 10, 'source_script': 'latin', 'profile': 'consonant_symbols',
            'linguistic_certification': False, 'confidence': None, 'complete_ipa': False,
            'baseline_review_id': source['review_id'], 'entries': entries}


def record_dir(output, entry):
    return output / 'records' / (entry['id'] + '-' + entry['key'][:12])


def checked_record(output, entry):
    from quality import verify_encoded
    folder = record_dir(output, entry)
    record = json.loads((folder / 'realtime-status.json').read_text())
    if (record['status'] != 'audio_ready_for_pilot' or record['requested_model'] != 'gpt-realtime-2.1'
            or not realtime.model_matches(record.get('actual_model'), 'gpt-realtime-2.1')
            or record['tts_text'] != entry['tts_text']
            or record['request_key'] != realtime.request_identity('gpt-realtime-2.1', entry['tts_text'], entry['instructions'])):
        raise pilot.PilotError('three_voice_candidate_not_ready')
    for field, sha in [('raw_file', 'raw_sha256'), ('audio_file', 'audio_sha256')]:
        path = (folder / record[field]).resolve()
        if folder.resolve() not in path.parents or pilot.file_sha256(path) != record[sha]:
            raise pilot.PilotError('three_voice_cached_audio_corrupt_no_regeneration')
    if not verify_encoded(folder / record['audio_file'], 'word')['passed']:
        raise pilot.PilotError('three_voice_cached_audio_technical_failure')
    return record


def generate(output, baseline):
    output = pilot.output_path(output)
    spec = plan(baseline)
    saved_plan = output / 'plan.json'
    if saved_plan.exists() and json.loads(saved_plan.read_text()) != spec:
        raise pilot.PilotError('three_voice_previous_plan_requires_review')
    pilot.atomic_json(saved_plan, spec)
    ready = 0
    try:
        for entry in spec['entries']:
            result = realtime.run(record_dir(output, entry), model=spec['model'],
                                  tts_text=entry['tts_text'], instructions=entry['instructions'])
            if result['status'] != 'audio_ready_for_pilot':
                pilot.atomic_json(output / 'status.json', {'status': 'blocked', 'model': spec['model'],
                    'entry_id': entry['id'], 'technically_ready': ready, 'expected': 10,
                    'maximum_new_responses': 10, 'realtime_result': result, 'linguistic_certification': False})
                raise pilot.PilotError('three_voice_realtime_generation_blocked')
            checked_record(output, entry)
            ready += 1
            print(entry['id'] + ': MP3 réel techniquement conforme ; prononciation à écouter', flush=True)
        pilot.atomic_json(output / 'status.json', {'status': 'ready', 'model': spec['model'], 'voice': 'cedar',
            'new_candidates': 10, 'retained_audio_files': 20, 'maximum_new_responses': 10,
            'linguistic_certification': False})
    except pilot.PilotError as exc:
        status = output / 'status.json'
        if not status.exists() or json.loads(status.read_text()).get('status') != 'blocked':
            pilot.atomic_json(output / 'status.json', {'status': 'blocked', 'technically_ready': ready,
                'error': exc.code, 'maximum_new_responses': 10, 'linguistic_certification': False})
        raise


def build(output, baseline, site):
    spec = plan(baseline)
    entries = []
    for entry in spec['entries']:
        record = checked_record(output, entry)
        item = {k: v for k, v in entry.items() if k not in {'jamal_source', 'previous_source'}}
        item.update(new_sha256=record['audio_sha256'], actual_model=record['actual_model'],
                    technical_status='passed', pronunciation_status='uncertain', confidence=None,
                    new_warnings=sorted(set(record['raw_quality']['warnings'] + record['quality']['warnings'])))
        item['warnings'] = sorted(set(item['previous_warnings'] + item['new_warnings']))
        if record.get('generated_transcript'):
            item['generated_transcript_not_independent_validation'] = record['generated_transcript']
        for label, source in [('jamal', baseline / entry['jamal_source']),
                              ('previous', baseline / entry['previous_source']),
                              ('new', record_dir(output, entry) / record['audio_file'])]:
            path = f"{label}/{entry['id']}.mp3"
            destination = site / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
            item[label] = path
        entries.append(item)
    manifest = {k: v for k, v in spec.items() if k != 'entries'}
    manifest.update(entries=entries, models={'jamal': 'ar-MA-JamalNeural',
        'previous': 'gpt-4o-mini-tts-2025-12-15', 'new': spec['model']},
        themes=dict(re.findall(r"id: '([^']+)', titre: '([^']+)'", (pilot.ROOT / 'src/data/themes.ts').read_text())))
    manifest['review_id'] = digest(manifest)
    templates = pilot.ROOT / 'scripts/hadra/review-site'
    page = (templates / 'index.html').read_text().replace('50 MOTS', '10 MOTS · 3 VOIX').replace('sur 50', 'sur 10').replace('max="50"', 'max="10"')
    page = page.replace('Écouter avant / après', 'Comparer les trois voix')
    page = page.replace('Comparez la voix actuelle avec HADRA lisant le latin, puis choisissez la suite.',
        'Écoutez Jamal, le modèle OpenAI précédent et le nouveau modèle Realtime sur les mêmes mots et expressions.')
    page = page.replace('Avant : les MP3 actuellement utilisés. Après : HADRA lit le latin, avec les chiffres 3, 7 et 9.',
        'Jamal lit l’arabe. L’ancien OpenAI (gpt-4o-mini-tts) et le nouveau (gpt-realtime-2.1) utilisent la même notation phonétique cachée et la voix Cedar. Les vingt fichiers précédents sont conservés à l’identique.')
    page = page.replace('<h3>Avant</h3>', '<h3>Jamal</h3>')
    page = page.replace('<h3>Après</h3><p>HADRA · lecture du latin</p>', '<h3>Ancien OpenAI</h3><p>gpt-4o-mini-tts · Cedar</p>')
    page = page.replace('aria-label="Écouter après"', 'aria-label="Écouter l’ancien OpenAI"')
    page = page.replace('      </div>\n      <label class="speed">',
        '<section><h3>Nouveau OpenAI</h3><p>gpt-realtime-2.1 · Cedar</p><audio id="new-audio" controls preload="none" aria-label="Écouter le nouveau OpenAI"></audio></section>\n      </div>\n      <label class="speed">', 1)
    page = page.replace('data-vote="before">Je préfère avant', 'data-vote="jamal">Jamal')
    page = page.replace('data-vote="after">Je préfère après', 'data-vote="previous">Ancien OpenAI')
    page = page.replace('<button type="button" data-vote="review">', '<button type="button" data-vote="new">Nouveau OpenAI</button><button type="button" data-vote="review">')
    page = page.replace('<option value="approve">Je valide la nouvelle voix</option><option value="reject">Je refuse le déploiement</option>',
        '<option value="jamal">Je préfère Jamal</option><option value="previous">Je préfère l’ancien OpenAI</option><option value="new">Je préfère le nouveau OpenAI</option>')
    page = page.replace('Vos avis restent dans ce navigateur.', 'Aucun avis ne déclenche de déploiement automatique. Vos avis restent dans ce navigateur.')
    js = (templates / 'review.js').read_text().replace('HADRA_REVIEW', 'THREE_REVIEW').replace('darija-hadra-review-', 'darija-three-voices-')
    js = js.replace("const players = [el('before'), el('after')]", "const players = [el('before'), el('after'), el('new-audio')]")
    js = js.replace('`${count} avis sur 50`', '`${count} avis sur ${data.count}`')
    js = js.replace("`${preferred('after')} préférences pour après · ${preferred('before')} pour avant · ${preferred('review')} à revoir.`",
        "`${preferred('jamal')} Jamal · ${preferred('previous')} ancien OpenAI · ${preferred('new')} nouveau OpenAI · ${preferred('review')} à revoir.`")
    js = js.replace("el('before').src = entry.before", "el('before').src = entry.jamal")
    js = js.replace("el('after').src = entry.after", "el('after').src = entry.previous\n    el('new-audio').src = entry.new")
    js = js.replace('dans le nouveau fichier.', 'dans un fichier OpenAI.').replace('Le nouveau fichier présente', 'Un fichier OpenAI présente')
    js = js.replace('model: data.model, source_script:', 'models: data.models, voice: data.voice, source_script:')
    js = js.replace('id: entry.id, latin: entry.latin, after_sha256: entry.after_sha256,',
        'id: entry.id, latin: entry.latin, tts_text: entry.tts_text, jamal_sha256: entry.jamal_sha256, previous_sha256: entry.previous_sha256, new_sha256: entry.new_sha256,')
    js = js.replace('avis-hadra-50-mots.json', 'avis-trois-voix.json')
    (site / 'index.html').write_text(page)
    (site / 'review.js').write_text(js)
    (site / 'review.css').write_text((templates / 'review.css').read_text() + '\n.votes{grid-template-columns:repeat(2,minmax(0,1fr))}\n')
    pilot.atomic_json(site / 'manifest.json', manifest)
    (site / 'data.js').write_text('window.THREE_REVIEW = ' + json.dumps(manifest, ensure_ascii=False).replace('<', '\\u003c') + ';\n')
    verify(site, pilot.ROOT, baseline)
    pilot.atomic_json(output / 'review-queue.json', {'review_id': manifest['review_id'], 'linguistic_certification': False,
        'entries': [{'id': e['id'], 'warnings': e['new_warnings'], 'pronunciation_status': 'uncertain', 'confidence': None} for e in entries]})
    return manifest


def verify(site, checkout, baseline):
    spec = plan(baseline)
    manifest = json.loads((site / 'manifest.json').read_text())
    expected = {e['id']: e for e in spec['entries']}
    catalog = pilot.read_catalog(checkout)
    if (manifest['count'] != 10 or len(manifest['entries']) != 10
            or {e['id'] for e in manifest['entries']} != set(expected)
            or manifest['model'] != spec['model'] or manifest['voice'] != 'cedar'
            or manifest['linguistic_certification'] is not False
            or manifest['review_id'] != digest({k: v for k, v in manifest.items() if k != 'review_id'})):
        raise pilot.PilotError('three_voice_manifest_mismatch')
    for entry in manifest['entries']:
        source = expected[entry['id']]
        current = catalog[entry['id']]
        if (entry['latin'] != current['latin'] or entry['tts_text'] != source['tts_text']
                or entry['instructions'] != source['instructions'] or entry['key'] != source['key']
                or entry['jamal_sha256'] != pilot.file_sha256(checkout / 'public' / current['audio'])
                or entry['previous_sha256'] != source['previous_sha256']
                or not realtime.model_matches(entry.get('actual_model'), spec['model'])
                or entry['technical_status'] != 'passed' or entry['pronunciation_status'] != 'uncertain'
                or entry['confidence'] is not None):
            raise pilot.PilotError('three_voice_sources_or_status_changed')
        for label in ['jamal', 'previous', 'new']:
            path = (site / entry[label]).resolve()
            if site.resolve() not in path.parents or pilot.file_sha256(path) != entry[label + '_sha256']:
                raise pilot.PilotError('three_voice_audio_integrity_failed')
    return manifest


def publish(site, checkout, baseline):
    memory = (checkout / 'CLAUDE.md').read_text()
    verify(site, checkout, baseline)
    target = checkout / 'public' / FOLDER
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(site, target)
    note = '- Comparatif trois voix (2026-10-15) : `/test-audio-trois-voix/`, dix entrées avec Jamal, ancien OpenAI/Cedar et gpt-realtime-2.1/Cedar. Dix nouveaux MP3, vingt anciens conservés ; avis locaux et export, sans activation dans les exercices ni certification de prononciation.'
    if note not in memory:
        memory = memory.replace('## Points en suspens\n', '## Points en suspens\n\n' + note + '\n', 1)
        if len(memory.splitlines()) >= 300 or len(memory) >= 45000:
            raise pilot.PilotError('memory_too_long')
        (checkout / 'CLAUDE.md').write_text(memory)
    history = checkout / 'docs/historique.md'
    text = history.read_text()
    row = '| 2026-10-15 | Comparatif de dix entrées à trois voix : Jamal, ancien OpenAI et nouveau Realtime ; trente MP3, avis locaux et export, exercices conservés | `public/test-audio-trois-voix/` |\n'
    if row not in text:
        history.write_text(text.replace('## Décisions', row + '\n## Décisions', 1))
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=checkout, text=True).strip()
    git('config', 'user.name', 'github-actions[bot]')
    git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
    git('add', 'public/' + FOLDER, 'CLAUDE.md', 'docs/historique.md')
    paths = git('diff', '--cached', '--name-only').splitlines()
    if any(p not in {'CLAUDE.md', 'docs/historique.md'} and not p.startswith('public/' + FOLDER + '/') for p in paths):
        raise pilot.PilotError('unexpected_three_voice_publication_changes')
    if paths:
        git('commit', '-m', 'test: publie dix comparaisons entre Jamal et deux modèles OpenAI')
        for _ in range(4):
            verify(site, checkout, baseline)
            result = subprocess.run(['git', 'push', 'origin', 'HEAD:main'], cwd=checkout, capture_output=True, text=True)
            if result.returncode == 0:
                break
            if 'non-fast-forward' in result.stderr or 'fetch first' in result.stderr:
                git('fetch', 'origin', 'main'); git('rebase', 'FETCH_HEAD')
                (checkout / 'CLAUDE.md').read_text()
        else:
            raise pilot.PilotError('three_voice_push_failed')
    subprocess.run(['gh', 'api', '--method', 'POST', 'repos/mcofirty/Darijapp/actions/workflows/publier.yml/dispatches', '-f', 'ref=main'], check=True)


def check_http(site, output):
    expected = json.loads((site / 'manifest.json').read_text())
    url = 'https://mcofirty.github.io/Darijapp/' + FOLDER + '/'
    def read(path):
        with urllib.request.urlopen(url + path, timeout=30) as response:
            return response.read()
    for attempt in range(75):
        try:
            if json.loads(read('manifest.json')) != expected:
                raise pilot.PilotError('three_voice_http_stale_manifest')
            break
        except Exception:
            if attempt == 74:
                raise
            time.sleep(10)
    for entry in expected['entries']:
        for label in ['jamal', 'previous', 'new']:
            if hashlib.sha256(read(entry[label])).hexdigest() != entry[label + '_sha256']:
                raise pilot.PilotError('three_voice_http_audio_mismatch')
    for asset in ['index.html', 'review.css', 'review.js', 'data.js']:
        if read(asset) != (site / asset).read_bytes():
            raise pilot.PilotError('three_voice_http_asset_mismatch')
    result = {'url': url, 'review_id': expected['review_id'], 'status': 'passed',
              'entries': 10, 'audio_files_checked': 30, 'linguistic_certification': False}
    pilot.atomic_json(output / 'http-check.json', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['generate', 'build', 'publish', 'check'])
    parser.add_argument('--output', type=Path, default=pilot.ROOT / 'artifacts/three-voices')
    parser.add_argument('--site', type=Path, default=pilot.ROOT / 'artifacts/three-voices-site')
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
