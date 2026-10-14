"""Dix MP3 OpenAI depuis le latin ; aucune activation de la voix de production."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/hadra"))
from catalog import atomic_json, file_sha256, latin_prompt, read_catalog

ENDPOINT = "https://api.openai.com/v1/audio/speech"
SPEC = ROOT / "scripts/openai_tts/pilot-10.json"
INSTRUCTIONS = ROOT / "scripts/openai_tts/instructions.txt"
VERSION = 1
LIMIT = 10


class PilotError(RuntimeError):
    def __init__(self, code, provider_code=None):
        super().__init__(code)
        self.code = code
        self.provider_code = provider_code


def plan():
    spec = json.loads(SPEC.read_text())
    ids = spec["entry_ids"]
    if len(ids) != LIMIT or len(set(ids)) != LIMIT:
        raise PilotError("pilot_must_have_exactly_10_unique_entries")
    if spec["model"] != "gpt-4o-mini-tts-2025-12-15" or spec["voice"] != "cedar":
        raise PilotError("unreviewed_model_or_voice")
    catalog = read_catalog()
    instructions = INSTRUCTIONS.read_text().strip()
    records = []
    for entry_id in ids:
        entry = catalog[entry_id]
        before = ROOT / "public" / entry["audio"]
        if not before.is_file():
            raise PilotError("missing_current_audio")
        payload = {"model": spec["model"], "voice": spec["voice"],
                   "input": latin_prompt(entry["latin"]), "instructions": instructions,
                   "response_format": "mp3", "speed": 1.0}
        key = hashlib.sha256(json.dumps({"request": payload, "version": VERSION},
                                       sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        records.append({**entry, "key": key, "request": payload,
                        "before_sha256": file_sha256(before)})
    return {"model": spec["model"], "voice": spec["voice"], "source_script": "latin",
            "linguistic_certification": False, "maximum_paid_requests": LIMIT, "entries": records}


def output_path(path):
    path = Path(path).resolve()
    if path == ROOT / "public" or ROOT / "public" in path.parents:
        raise PilotError("generation_output_must_be_outside_public")
    path.mkdir(parents=True, exist_ok=True)
    return path


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Authorization must only be sent to the fixed OpenAI endpoint.
        return None


def synthesize(payload, api_key):
    request = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(),
                                    headers={"Authorization": f"Bearer {api_key}",
                                             "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=90) as response:
            audio = response.read(4 * 1024 * 1024 + 1)
        if not audio or len(audio) > 4 * 1024 * 1024:
            raise PilotError("unexpected_audio_response_size")
        return audio
    except urllib.error.HTTPError as exc:
        # Never dump headers, request contents, or external response bodies.
        provider_code = None
        try:
            error = json.loads(exc.read(4096)).get("error", {})
            allowed = {"insufficient_quota", "rate_limit_exceeded", "billing_hard_limit_reached",
                       "billing_not_active", "model_not_found", "invalid_api_key"}
            for field in ["code", "type"]:
                if error.get(field) in allowed:
                    provider_code = error[field]
                    break
        except Exception:
            pass
        raise PilotError(f"openai_http_{exc.code}", provider_code) from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise PilotError("openai_connection_failed_no_automatic_retry") from None


def report_status(output, status, error=None, provider_code=None, current_plan=None):
    records = []
    for path in sorted((output / "records").glob("*.json")):
        record = json.loads(path.read_text())
        if current_plan is None or record.get("key") in {e["key"] for e in current_plan["entries"]}:
            records.append(record)
    result = {"status": status, "model": "gpt-4o-mini-tts-2025-12-15", "voice": "cedar",
              "expected": LIMIT, "attempted": len(records),
              "technically_ready": sum(r.get("technical_status") == "passed" for r in records),
              "error": error, "provider_error_code": provider_code,
              "linguistic_certification": False, "production_voice": "Jamal"}
    if current_plan and current_plan.get("revision"):
        result.update(revision=current_plan["revision"], maximum_paid_requests=4,
                      new_candidates=sum(bool(r.get("api_synthesized")) for r in records),
                      retained_candidates=sum(bool(r.get("imported_from_review")) for r in records))
    atomic_json(output / "status.json", result)
    return result


def recover_rejected_429(output, pilot):
    """Reprise explicite du premier appel dont le rejet 429 a été confirmé."""
    status = json.loads((output / "status.json").read_text())
    if (status.get("error") != "openai_http_429" or status.get("attempted") != 1
            or status.get("technically_ready") != 0):
        raise PilotError("recovery_requires_confirmed_first_request_429")
    first = pilot["entries"][0]
    basename = f"{first['entry_id']}-{first['key'][:12]}"
    path = output / "records" / f"{basename}.json"
    record = json.loads(path.read_text())
    if (record.get("key") != first["key"] or record.get("technical_status") != "pending"
            or len(list((output / "records").glob("*.json"))) != 1
            or (output / "raw" / f"{basename}.mp3").exists()
            or (output / "audio" / f"{basename}.mp3").exists()):
        raise PilotError("recovery_cannot_discard_generated_audio_or_uncertain_request")
    atomic_json(output / "rejections" / f"{basename}-confirmed-429.json", {"record": record, "status": status})
    path.unlink()


def generate(output, recover_429=False, pilot_plan=None, new_entry_ids=None, max_new_requests=LIMIT):
    output = output_path(output)
    pilot = pilot_plan or plan()
    if len(pilot["entries"]) != LIMIT or not 0 <= max_new_requests <= LIMIT:
        raise PilotError("invalid_generation_budget")
    paid_requests = 0
    if recover_429:
        recover_rejected_429(output, pilot)
    atomic_json(output / "plan.json", pilot)
    # The key is never persisted; only the public request specification is cached.
    api_key = os.environ.get("DARIJA_TTS_KEY") or os.environ.get("OPENAI_API_KEY")
    try:
        from quality import verify_encoded
        for entry in pilot["entries"]:
            basename = f"{entry['entry_id']}-{entry['key'][:12]}"
            raw = output / "raw" / f"{basename}.mp3"
            encoded = output / "audio" / f"{basename}.mp3"
            record_path = output / "records" / f"{basename}.json"
            record = {"entry_id": entry["entry_id"], "key": entry["key"],
                      "latin": entry["latin"], "prompt": entry["request"]["input"],
                      "model": pilot["model"], "voice": pilot["voice"],
                      "source_script": "latin", "pronunciation_status": "uncertain",
                      "confidence": None, "technical_status": "pending"}
            if record_path.exists():
                previous = json.loads(record_path.read_text())
                if previous.get("key") != entry["key"]:
                    raise PilotError("cache_key_mismatch")
                if previous.get("technical_status") == "failed":
                    raise PilotError("previous_technical_failure_requires_review")
                if not raw.exists():
                    raise PilotError("previous_request_without_audio_requires_review")
                if previous.get("raw_sha256") != file_sha256(raw):
                    raise PilotError("cached_audio_corrupt_no_paid_regeneration")
                record = previous
                if record.get("technical_status") == "passed":
                    cached = (output / record["mp3"]).resolve()
                    if output not in cached.parents or not cached.is_file() or file_sha256(cached) != record["mp3_sha256"]:
                        raise PilotError("cached_export_corrupt_no_paid_regeneration")
                    if not verify_encoded(cached, "word")["passed"]:
                        raise PilotError("cached_export_technical_failure")
                    print(f"{entry['entry_id']}: MP3 conservé sans modification", flush=True)
                    continue
            else:
                if new_entry_ids is not None and entry["entry_id"] not in new_entry_ids:
                    raise PilotError("retained_candidate_missing_no_paid_regeneration")
                if paid_requests >= max_new_requests:
                    raise PilotError("paid_request_budget_exceeded")
                if not api_key:
                    raise PilotError("missing_api_key")
                if raw.exists():
                    raise PilotError("untracked_cached_audio_requires_review")
                raw.parent.mkdir(parents=True, exist_ok=True)
                # Record the attempt before calling: an uncertain timeout must not cause a paid retry.
                atomic_json(record_path, record)
                try:
                    paid_requests += 1
                    audio = synthesize(entry["request"], api_key)
                except PilotError as exc:
                    if exc.code in ["openai_http_401", "openai_http_403", "openai_http_429"]:
                        # Explicit API rejection: no synthesis accepted. Stop this run;
                        # permit a later manual rerun after correcting key/quota.
                        atomic_json(output / "rejections" / f"{basename}.json",
                                    {"record": record, "error": exc.code, "provider_error_code": exc.provider_code})
                        record_path.unlink()
                    raise
                temporary = raw.with_suffix(".tmp")
                temporary.write_bytes(audio)
                temporary.replace(raw)
                record["raw_sha256"] = file_sha256(raw)
                record["api_synthesized"] = True
                record["instructions"] = entry["request"]["instructions"]
                atomic_json(record_path, record)
            record["raw_quality"] = verify_encoded(raw, "word")
            if record["raw_quality"]["passed"]:
                encoded.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-map_metadata", "-1",
                                "-ac", "1", "-ar", "24000", "-af", "volume=0.8", "-b:a", "64k",
                                str(encoded)], check=True, capture_output=True)
                record["encoded_quality"] = verify_encoded(encoded, "word")
                record["technical_status"] = "passed" if record["encoded_quality"]["passed"] else "failed"
                record["mp3"] = str(encoded.relative_to(output))
                record["mp3_sha256"] = file_sha256(encoded)
            else:
                record["technical_status"] = "failed"
            atomic_json(record_path, record)
            print(f"{entry['entry_id']}: {record['technical_status']} (prononciation à écouter)", flush=True)
        result = report_status(output, "ready", current_plan=pilot)
        if result["technically_ready"] != LIMIT:
            raise PilotError("technical_rejections_no_automatic_regeneration")
        return result
    except PilotError as exc:
        report_status(output, "blocked", exc.code, exc.provider_code, pilot)
        raise
    except Exception:
        report_status(output, "blocked", "technical_processing_failed", current_plan=pilot)
        raise PilotError("technical_processing_failed") from None


def build_review(reports, output, pilot_plan=None):
    pilot = pilot_plan or plan()
    entries = []
    # Validate all ten first; no incomplete/fake audio page is ever published.
    for entry in pilot["entries"]:
        basename = f"{entry['entry_id']}-{entry['key'][:12]}"
        record = json.loads((reports / "records" / f"{basename}.json").read_text())
        if (record.get("key") != entry["key"] or record.get("technical_status") != "passed"
                or record.get("source_script") != "latin" or record.get("prompt") != entry["request"]["input"]
                or record.get("model") != pilot["model"] or record.get("voice") != pilot["voice"]):
            raise PilotError("review_record_not_current_or_not_ready")
        after = (reports / record["mp3"]).resolve()
        if reports.resolve() not in after.parents or file_sha256(after) != record["mp3_sha256"]:
            raise PilotError("review_audio_integrity_failed")
        if entry.get("retained_sha256") and record["mp3_sha256"] != entry["retained_sha256"]:
            raise PilotError("retained_candidate_was_modified")
        entries.append({"id": entry["entry_id"], "latin": entry["latin"], "arabe": entry["arabe"],
                        "fr": entry["fr"], "theme": entry["theme"], "tts_text": record["prompt"],
                        "before": f"before/{entry['entry_id']}.mp3", "after": f"after/{basename}.mp3",
                        "before_sha256": entry["before_sha256"], "after_sha256": record["mp3_sha256"],
                        "technical_status": "passed", "pronunciation_status": "uncertain", "confidence": None,
                        "warnings": sorted(set(record["raw_quality"]["warnings"] + record["encoded_quality"]["warnings"]))})
        entries[-1]["instructions"] = entry["request"]["instructions"]
        if pilot.get("revision"):
            entries[-1]["revised"] = entry["entry_id"] in pilot["revised_ids"]
            if entries[-1]["revised"]:
                previous = reports / "previous" / f"{entry['entry_id']}.mp3"
                if file_sha256(previous) != entry["previous_sha256"]:
                    raise PilotError("previous_candidate_integrity_failed")
                entries[-1].update(previous=f"previous/{entry['entry_id']}.mp3",
                                   previous_sha256=entry["previous_sha256"])
    output.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        for label, source in [("before", ROOT / "public" / "audio" / f"{entry['id']}.mp3"),
                              ("after", reports / "audio" / Path(entry["after"]).name)]:
            destination = output / entry[label]
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        if entry.get("previous"):
            destination = output / entry["previous"]
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(reports / entry["previous"], destination)
    templates = ROOT / "scripts/hadra/review-site"
    html = (templates / "index.html").read_text().replace("50 MOTS", "10 MOTS").replace("sur 50", "sur 10").replace('max="50"', 'max="10"').replace("HADRA", "OpenAI")
    html = html.replace("OpenAI · lecture du latin", "OpenAI · Cedar · lecture du latin")
    html = html.replace("Après : OpenAI lit le latin", "Après : une voix générée par OpenAI lit le latin")
    html = html.replace("Je valide la nouvelle voix", "Je valide ce premier test").replace("Je refuse le déploiement", "Je refuse cette voix")
    html = html.replace("Vos avis restent dans ce navigateur.", "Votre avis permet de décider du test de 50 mots. Il ne déclenche aucun déploiement. Vos avis restent dans ce navigateur.")
    js = (templates / "review.js").read_text().replace("HADRA_REVIEW", "OPENAI_REVIEW").replace("darija-hadra-review-", "darija-openai-review-").replace("${count} avis sur 50", "${count} avis sur ${data.count}").replace("avis-hadra-50-mots.json", "avis-openai-10-mots.json")
    if pilot.get("revision"):
        html = html.replace('ESPACE DE TEST · 10 MOTS', 'ESPACE DE TEST · 4 MOTS REPRIS')
        html = html.replace('Comparez la voix actuelle avec OpenAI lisant le latin, puis choisissez la suite.', 'Quatre nouvelles propositions pour khobz, ch7al?, we99e3 et 3tchan. Les six autres MP3 sont conservés à l’identique ; écoutez ces corrections avant de décider de la suite.')
        html = html.replace('<section class="filters"', '<label class="small"><input id="only-revised" type="checkbox" checked> Afficher seulement les quatre mots repris</label>\n    <section class="filters"')
        html = html.replace('<fieldset>', '<details id="previous-sample" hidden><summary>Écouter le premier essai OpenAI</summary><audio id="previous-audio" controls preload="none" aria-label="Écouter le premier essai OpenAI"></audio></details>\n      <fieldset>', 1)
        html = html.replace('OpenAI · Cedar · lecture du latin', 'OpenAI · Cedar · nouvel essai pour les mots repris')
        html = html.replace('Je valide ce premier test', 'Je valide ce test corrigé')
        html = html.replace('0 avis sur 10', '0 avis sur 4').replace('max="10"', 'max="4"')
        js = js.replace("const players = [el('before'), el('after')]", "const players = [el('before'), el('after'), el('previous-audio')]")
        js = js.replace("el('after').src = entry.after", "el('after').src = entry.after\n    el('previous-sample').hidden = !entry.previous\n    if (entry.previous) el('previous-audio').src = entry.previous\n    else el('previous-audio').removeAttribute('src')")
        js = js.replace("(!theme || entry.theme === theme)", "(!el('only-revised').checked || entry.revised) && (!theme || entry.theme === theme)")
        js = js.replace("el('search').addEventListener('input', filter)", "el('only-revised').addEventListener('change', filter)\n  el('search').addEventListener('input', filter)")
        js = js.replace("  render()\n})()", "  filter()\n})()")
        js = js.replace("avis-openai-10-mots.json", "avis-openai-corrections.json")
        js = js.replace("`${count} avis sur ${data.count}`", "`${count} avis sur 4`")
        js = js.replace("data.entries.filter(entry => state.votes[entry.id]).length", "data.entries.filter(entry => entry.revised && state.votes[entry.id]).length")
        js = js.replace("data.entries.filter(entry => state.votes[entry.id] === choice).length", "data.entries.filter(entry => entry.revised && state.votes[entry.id] === choice).length")
        js = js.replace("if (saved && typeof saved.votes === 'object' && typeof saved.notes === 'object') state = saved", "if (saved && typeof saved.votes === 'object' && typeof saved.notes === 'object') state = saved\n    else if (data.baseline_review_id) {\n      const previous = JSON.parse(localStorage.getItem(`darija-openai-review-${data.baseline_review_id}`) || 'null')\n      if (previous) data.entries.filter(entry => !entry.revised).forEach(entry => {\n        if (previous.votes?.[entry.id]) state.votes[entry.id] = previous.votes[entry.id]\n        if (previous.notes?.[entry.id]) state.notes[entry.id] = previous.notes[entry.id]\n      })\n    }")
    (output / "index.html").write_text(html)
    (output / "review.js").write_text(js)
    shutil.copyfile(templates / "review.css", output / "review.css")
    manifest = {"version": VERSION, "model": pilot["model"], "voice": pilot["voice"],
                "source_script": "latin", "count": LIMIT, "linguistic_certification": False,
                "instructions": INSTRUCTIONS.read_text().strip(), "entries": entries,
                "themes": dict(re.findall(r"id: '([^']+)', titre: '([^']+)'", (ROOT / "src/data/themes.ts").read_text()))}
    manifest["review_id"] = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()
    if pilot.get("revision"):
        manifest.update(revision=pilot["revision"], baseline_review_id=pilot["baseline_review_id"])
    atomic_json(output / "manifest.json", manifest)
    (output / "data.js").write_text("window.OPENAI_REVIEW = " + json.dumps(manifest, ensure_ascii=False) + ";\n")
    print("10 mots, 20 MP3 vérifiés ; comparatif OpenAI prêt")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["plan", "generate", "review"])
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/openai-tts")
    parser.add_argument("--reports", type=Path, default=ROOT / "artifacts/openai-tts")
    parser.add_argument("--recover-rejected-429", action="store_true")
    args = parser.parse_args()
    try:
        if args.command == "plan":
            print(json.dumps(plan(), ensure_ascii=False, indent=2))
        elif args.command == "generate":
            generate(args.output, args.recover_rejected_429)
        else:
            build_review(args.reports, args.output)
    except PilotError as exc:
        print(f"Test OpenAI interrompu : {exc.code}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
