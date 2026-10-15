"""Compare deux entrées sans chiffres sur un seul mot, sans changer l’application."""
import argparse
import hashlib
import html
import json
import os
import shutil
import subprocess
from pathlib import Path

import pilot
from phonetic import PROFILES, convert
from audio_texts import audio_catalog

ENTRY_ID = "verbes-085"
MODEL = "gpt-4o-mini-tts-2025-12-15"
INSTRUCTIONS = """Speak Moroccan Darija with a natural Moroccan accent. Read only the supplied verb meaning 'to sign', exactly once, with no introduction, explanation, spelling, or translation. The input is a Latin phonetic rendering, not an English word. The characters ʿ and ʕ represent the voiced pharyngeal consonant ayn /ʕ/, ʾ and ʔ represent a glottal stop, ḥ and ħ represent a voiceless pharyngeal /ħ/, and q represents a uvular stop /q/, never the English name of a letter. A doubled q is a sustained consonant, not two words. Start with consonant w and a short unstressed vowel, preserve the doubled consonant and the final pharyngeal consonant. Output only the Moroccan word, without speaking the names of the symbols."""


def plan():
    source = pilot.read_catalog()[ENTRY_ID]
    audio_entry = audio_catalog()["entries"][ENTRY_ID]
    records = []
    for profile in PROFILES:
        notation = convert(source["latin"], profile)
        notation["tts_text"] = audio_entry["audio_text"][profile]
        notation["origin"] = audio_entry["origin"]
        if notation["tts_text"] is None or any(c.isdigit() for c in notation["tts_text"]):
            raise pilot.PilotError("phonetic_probe_requires_digit_free_input")
        request = {"model": MODEL, "voice": "cedar", "input": notation["tts_text"],
                   "instructions": INSTRUCTIONS, "response_format": "mp3", "speed": 1.0}
        key = hashlib.sha256(json.dumps({"request": request, "profile": profile, "notation_version": 1},
                                       sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        records.append({"profile": profile, "key": key, "request": request, "notation": notation})
    if len(records) != 2:
        raise pilot.PilotError("phonetic_probe_budget_must_be_two")
    return {"model": MODEL, "voice": "cedar", "entry_id": ENTRY_ID, "latin": source["latin"],
            "fr": source["fr"], "maximum_paid_requests": 2, "source_script": "latin",
            "complete_ipa": False, "linguistic_certification": False, "confidence": None, "records": records}


def generate(output, baseline):
    from quality import verify_encoded
    output = pilot.output_path(output)
    spec = plan()
    pilot.atomic_json(output / "plan.json", spec)
    source_manifest = json.loads((baseline / "manifest.json").read_text())
    original = next(e for e in source_manifest["entries"] if e["id"] == ENTRY_ID)
    source = (baseline / original["after"]).resolve()
    if (baseline.resolve() not in source.parents or original["latin"] != spec["latin"]
            or pilot.file_sha256(source) != original["after_sha256"]):
        raise pilot.PilotError("phonetic_probe_baseline_mismatch")
    original_path = output / "original.mp3"
    shutil.copyfile(source, original_path)
    spec["original_sha256"] = original["after_sha256"]
    key = os.environ.get("DARIJA_TTS_KEY") or os.environ.get("OPENAI_API_KEY")
    try:
        for sample in spec["records"]:
            stem = sample["profile"] + "-" + sample["key"][:12]
            record_path = output / (stem + ".json")
            raw = output / (stem + "-raw.mp3")
            audio = output / (stem + ".mp3")
            if record_path.exists():
                saved = json.loads(record_path.read_text())
                if saved.get("key") != sample["key"] or saved.get("technical_status") != "passed":
                    raise pilot.PilotError("previous_probe_request_needs_review")
                if (not raw.exists() or pilot.file_sha256(raw) != saved["raw_sha256"]
                        or not audio.exists() or pilot.file_sha256(audio) != saved["sha256"]):
                    raise pilot.PilotError("probe_cache_corrupt_no_paid_regeneration")
                if not verify_encoded(audio, "word")["passed"]:
                    raise pilot.PilotError("probe_cache_technical_failure")
            else:
                if not key:
                    raise pilot.PilotError("missing_api_key")
                saved = {"key": sample["key"], "profile": sample["profile"], "technical_status": "pending"}
                pilot.atomic_json(record_path, saved)
                try:
                    data = pilot.synthesize(sample["request"], key)
                except pilot.PilotError as exc:
                    if exc.code in {"openai_http_401", "openai_http_403", "openai_http_429"}:
                        record_path.unlink()
                    raise
                raw.write_bytes(data)
                saved["raw_sha256"] = pilot.file_sha256(raw)
                raw_qa = verify_encoded(raw, "word")
                saved["raw_quality"] = raw_qa
                if not raw_qa["passed"]:
                    saved["technical_status"] = "failed"
                    pilot.atomic_json(record_path, saved)
                    raise pilot.PilotError("phonetic_probe_technical_rejection")
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-map_metadata", "-1",
                                "-ac", "1", "-ar", "24000", "-af", "volume=0.8", "-b:a", "64k", str(audio)],
                               check=True, capture_output=True)
                qa = verify_encoded(audio, "word")
                saved.update(quality=qa, technical_status="passed" if qa["passed"] else "failed",
                             sha256=pilot.file_sha256(audio), file=audio.name,
                             pronunciation_status="uncertain", confidence=None)
                pilot.atomic_json(record_path, saved)
                if not qa["passed"]:
                    raise pilot.PilotError("phonetic_probe_technical_rejection")
            sample.update(audio=saved["file"], sha256=saved["sha256"], technical_status="passed",
                          warnings=saved["quality"]["warnings"], pronunciation_status="uncertain", confidence=None)
        spec["test_id"] = hashlib.sha256(json.dumps(spec, sort_keys=True).encode()).hexdigest()
        pilot.atomic_json(output / "ready.json", spec)
        pilot.atomic_json(output / "status.json", {"status": "ready", "samples": 2, "maximum_paid_requests": 2,
                                                  "linguistic_certification": False})
        return spec
    except pilot.PilotError as exc:
        pilot.atomic_json(output / "status.json", {"status": "blocked", "error": exc.code,
                                                  "provider_error_code": exc.provider_code,
                                                  "maximum_paid_requests": 2, "linguistic_certification": False})
        raise


def build(output, site):
    spec = json.loads((output / "ready.json").read_text())
    if len(spec["records"]) != 2 or spec["entry_id"] != ENTRY_ID:
        raise pilot.PilotError("invalid_phonetic_probe")
    site.mkdir(parents=True, exist_ok=True)
    if pilot.file_sha256(output / "original.mp3") != spec["original_sha256"]:
        raise pilot.PilotError("probe_original_integrity_failed")
    shutil.copyfile(output / "original.mp3", site / "original.mp3")
    cards = ['<section><h2>Latin avec chiffres</h2><p>Lecture précédente par OpenAI</p><code>' + html.escape(spec["latin"]) + '</code><audio controls preload="none" src="original.mp3"></audio></section>']
    labels = {"latin_phonetic": "Latin phonétique", "consonant_symbols": "Symboles consonantiques"}
    for record in spec["records"]:
        source = output / record["audio"]
        if record["technical_status"] != "passed" or pilot.file_sha256(source) != record["sha256"]:
            raise pilot.PilotError("probe_sample_integrity_failed")
        shutil.copyfile(source, site / source.name)
        warning = '<p class="alert">Des pauses inhabituelles ont été détectées.</p>' if record["warnings"] else ''
        cards.append('<section><h2>' + labels[record["profile"]] + '</h2><p>Texte envoyé à la voix :</p><code>' + html.escape(record["request"]["input"]) + '</code><audio controls preload="none" src="' + source.name + '"></audio>' + warning + '</section>')
    page = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Test sans chiffres · Darija</title><link rel="stylesheet" href="review.css"><main>
<a class="back" href="../test-audio-openai/">‹ Comparatif des dix mots</a><p class="eyebrow">ESSAI · DEUX NOTATIONS</p><h1>Lire les chiffres comme des sons</h1><p class="intro">Le mot affiché reste <strong>we99e3</strong> (« signer »). Seul le texte envoyé à la voix change. Les trois lecteurs utilisent OpenAI/Cedar.</p>
<p>Ces conversions conservent les consonnes doublées. Les voyelles restent celles du latin ; ce n’est pas une transcription IPA complète. Les fichiers passent les contrôles techniques, sans certification de prononciation.</p>
<div class="players">''' + ''.join(cards) + '''</div><label>Votre préférence<select id="choice"><option value="pending">Je n’ai pas encore décidé</option><option value="latin_phonetic">Latin phonétique</option><option value="consonant_symbols">Symboles consonantiques</option><option value="neither">Aucune des deux versions</option></select></label><label>Une remarque<textarea id="note" rows="3"></textarea></label><button id="export" type="button" class="primary">Télécharger mon avis</button><p class="small">Vos avis restent dans ce navigateur. Aucun changement de voix dans les exercices n’est déclenché.</p><p id="storage-message" role="status"></p></main><script>
const spec = SPEC;
const key = 'darija-phonetic-probe-' + spec.test_id;
const choice = document.getElementById('choice'), note = document.getElementById('note');
try { const saved=JSON.parse(localStorage.getItem(key)||'null'); if(saved){choice.value=saved.preference;note.value=saved.note||''} } catch {}
function save(){try{localStorage.setItem(key,JSON.stringify({preference:choice.value,note:note.value}))}catch{document.getElementById('storage-message').textContent='Téléchargez votre avis pour le conserver.'}}
choice.addEventListener('change',save);note.addEventListener('input',save);
const players=[...document.querySelectorAll('audio')];players.forEach(p=>p.addEventListener('play',()=>players.filter(other=>other!==p).forEach(other=>other.pause())));
document.getElementById('export').addEventListener('click',()=>{const result={test_id:spec.test_id,latin:spec.latin,model:spec.model,preference:choice.value,note:note.value,linguistic_certification:false,samples:spec.records.map(r=>({profile:r.profile,tts_text:r.request.input,sha256:r.sha256}))};const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='avis-lecture-sans-chiffres.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)});
</script></html>'''
    public_spec = {k: v for k, v in spec.items()}
    page = page.replace('SPEC', json.dumps(public_spec, ensure_ascii=False).replace('<', '\\u003c'))
    (site / "index.html").write_text(page)
    shutil.copyfile(pilot.ROOT / "scripts/hadra/review-site/review.css", site / "review.css")
    pilot.atomic_json(site / "manifest.json", spec)
    return spec


def publish(site, checkout):
    # Read the complete project memory before any publication.
    memory = (checkout / "CLAUDE.md").read_text()
    spec = json.loads((site / "manifest.json").read_text())
    current = plan()
    main_entry = pilot.read_catalog(checkout)[ENTRY_ID]
    if spec["latin"] != main_entry["latin"] or spec["model"] != MODEL or spec["voice"] != "cedar":
        raise pilot.PilotError("phonetic_probe_source_changed")
    if [r['key'] for r in spec['records']] != [r['key'] for r in current['records']]:
        raise pilot.PilotError("phonetic_probe_not_current")
    for filename, sha in [("original.mp3", spec["original_sha256"])] + [(r["audio"], r["sha256"]) for r in spec["records"]]:
        path = (site / filename).resolve()
        if site.resolve() not in path.parents or pilot.file_sha256(path) != sha:
            raise pilot.PilotError("phonetic_probe_publication_integrity_failed")
    target = checkout / "public/test-audio-phonetic"
    if target.exists(): shutil.rmtree(target)
    shutil.copytree(site, target)
    note = "- Test sans chiffres (2026-10-15) : `/test-audio-phonetic/` compare deux transcriptions latines/phonétiques de we99e3 avec la lecture chiffrée. Aucun latin affiché ni MP3 actif modifié ; symboles non garantis par OpenAI, avis attendu avant tout élargissement."
    if note not in memory:
        memory = memory.replace('## Points en suspens\n', '## Points en suspens\n\n' + note + '\n', 1)
        if len(memory.splitlines()) >= 300 or len(memory) >= 45000: raise pilot.PilotError('memory_too_long')
        (checkout / 'CLAUDE.md').write_text(memory)
    history=checkout/'docs/historique.md';text=history.read_text()
    row='| 2026-10-15 | Essai de deux notations phonétiques sans chiffres sur we99e3, avec lecture chiffrée de référence et avis locaux ; application conservée | `public/test-audio-phonetic/` |\n'
    if row not in text: history.write_text(text.replace('## Décisions',row+'\n## Décisions',1))
    def git(*args):return subprocess.check_output(['git',*args],cwd=checkout,text=True).strip()
    git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
    git('add','public/test-audio-phonetic','CLAUDE.md','docs/historique.md')
    changed=git('diff','--cached','--name-only').splitlines()
    if any(p not in {'CLAUDE.md','docs/historique.md'} and not p.startswith('public/test-audio-phonetic/') for p in changed):
        raise pilot.PilotError('unexpected_publication_changes')
    if changed:
        git('commit','-m','test: publie deux lectures phonétiques sans modifier le latin affiché')
        for attempt in range(4):
            result=subprocess.run(['git','push','origin','HEAD:main'],cwd=checkout,capture_output=True,text=True)
            if result.returncode==0:break
            if 'non-fast-forward' in result.stderr or 'fetch first' in result.stderr:
                git('fetch','origin','main');git('rebase','FETCH_HEAD');(checkout/'CLAUDE.md').read_text()
                if pilot.read_catalog(checkout)[ENTRY_ID]['latin']!=spec['latin']:raise pilot.PilotError('main_latin_changed')
        else:raise pilot.PilotError('publication_push_failed')
    subprocess.run(['gh','api','--method','POST','repos/mcofirty/Darijapp/actions/workflows/publier.yml/dispatches','-f','ref=main'],check=True)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['generate','build','publish'])
    parser.add_argument('--output',type=Path,default=pilot.ROOT/'artifacts/openai-phonetic')
    parser.add_argument('--site',type=Path,default=pilot.ROOT/'artifacts/openai-phonetic-site')
    parser.add_argument('--baseline',type=Path)
    parser.add_argument('--checkout',type=Path)
    args=parser.parse_args()
    if args.command=='generate':generate(args.output,args.baseline)
    elif args.command=='build':build(args.output,args.site)
    else:publish(args.site.resolve(),args.checkout.resolve())
