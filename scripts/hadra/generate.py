"""Planifie et produit une bibliothèque HADRA expérimentale depuis le latin du dépôt.

Les candidats sont conservés hors de public/audio. Conformité technique != prononciation validée.
"""

import argparse
import importlib.metadata
import json
import re
import subprocess
import sys
import time
from pathlib import Path

from catalog import ROOT, atomic_json, corpus_records, file_sha256, job_key, latin_prompt, read_catalog, read_pilot
from engine import resolve_precision
from quality import QUALITY_VERSION, verify_encoded, waveform_metrics


def select_records(catalog, args):
    records = (read_pilot(catalog, args.pilot) if args.scope == "pilot"
               else corpus_records(catalog, args.scope))
    if args.selection:
        selected = set(json.loads(args.selection.read_text())["entry_ids"])
        missing = selected - {r["entry_id"] for r in records}
        if missing:
            raise ValueError(f"Sélection inconnue : {sorted(missing)}")
        records = [r for r in records if r["entry_id"] in selected]
    if args.exclude_selection:
        excluded = set(json.loads(args.exclude_selection.read_text())["entry_ids"])
        records = [r for r in records if r.get("entry_id") not in excluded]
    if args.ids:
        ids = set(args.ids.split(","))
        records = [r for r in records if r.get("entry_id", r["pilot_id"]) in ids or r["pilot_id"] in ids]
        found = {r.get("entry_id", r["pilot_id"]) for r in records} | {r["pilot_id"] for r in records}
        if not ids <= found:
            raise ValueError(f"Entrées absentes du pilote : {sorted(ids - found)}")
    # Répartir les longs textes entre lots, de façon déterministe et sans doublons.
    records = sorted(records, key=lambda r: (-len(r["prompt"]), r["pilot_id"]))
    records = records[args.shard_index::args.shard_count]
    return records[:args.limit] if args.limit else records


def make_jobs(records, spec, reference, args):
    jobs = []
    for record in records:
        for variant in range(args.variants if record.get("complex") else 1):
            parameters = {"nfe_step": args.steps, "speed": args.speed, "cfg_strength": 2.0,
                          "seed": args.seed + variant, "device": args.device}
            if args.precision != "float32":
                parameters["precision"] = args.precision
            candidate = {**record}
            if record.get("contexts"):
                candidate["prompt"] = latin_prompt(record["contexts"][variant % len(record["contexts"])]
                                                   if variant else record["prompt"])
            key = job_key(candidate, spec, reference, parameters)
            jobs.append({**candidate, "key": key, "parameters": parameters, "variant": variant})
    return jobs


def cached_record(output: Path, key: str):
    path = output / "records" / f"{key}.json"
    if not path.exists():
        return None
    record = json.loads(path.read_text(encoding="utf-8"))
    master = output / record["master"]
    if not master.exists() or file_sha256(master) != record["master_sha256"]:
        return None
    return record


def generate(jobs, spec, reference, reference_audio, output, args):
    import numpy as np
    import soundfile as sf
    from engine import HadraEngine

    engine, results = None, []
    versions = {name: importlib.metadata.version(name) for name in
                ["f5-tts", "torch", "torchaudio", "torchcodec", "huggingface-hub", "vocos"]}
    started = time.monotonic()
    pending = list(jobs)
    attempted = set()
    while pending:
        if args.max_seconds and time.monotonic() - started >= args.max_seconds:
            print("Budget atteint : résultats partiels conservés", flush=True)
            return 3
        job = pending.pop(0)
        index = len(results) + 1
        key = job["key"]
        previous = cached_record(output, key)
        if previous:
            master = output / previous["master"]
            samples, rate = sf.read(master, dtype="float32")
            synthesis_seconds = previous["synthesis_seconds"]
            reused = True
        else:
            if engine is None:
                engine = HadraEngine(spec, reference_audio, reference["text"], args.device, args.threads)
            start = time.monotonic()
            samples, rate = engine.synthesize(job["prompt"], job["parameters"])
            synthesis_seconds = time.monotonic() - start
            samples = np.asarray(samples)
            master = output / "masters" / f"{key}.wav"
            master.parent.mkdir(parents=True, exist_ok=True)
            temporary = master.with_suffix(".tmp.wav")
            sf.write(temporary, samples, rate, subtype="FLOAT")
            temporary.replace(master)
            reused = False
        technical = waveform_metrics(samples, rate, job["kind"])
        mp3 = output / "audio" / f"{key}.mp3"
        encoded = None
        if technical["passed"]:
            mp3.parent.mkdir(parents=True, exist_ok=True)
            # Marge de niveau avant encodage pour éviter les dépassements liés au codec.
            temporary = mp3.with_suffix(".tmp.mp3")
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(master), "-af", "volume=0.8",
                            "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "64k",
                            str(temporary)], check=True)
            encoded = verify_encoded(temporary, job["kind"])
            temporary.replace(mp3)
        passed = technical["passed"] and encoded is not None and encoded["passed"]
        record = {**job, "model_id": spec["model_id"], "model_revision": spec["revision"],
                  "reference": reference, "versions": versions,
                  "master": str(master.relative_to(output)), "master_sha256": file_sha256(master),
                  "mp3": str(mp3.relative_to(output)) if passed else None,
                  "mp3_sha256": file_sha256(mp3) if passed else None,
                  "technical": technical, "encoded": encoded, "quality_version": QUALITY_VERSION,
                  "technical_status": "passed" if passed else "failed",
                  "pronunciation_status": "uncertain", "confidence": None,
                  "revision_reasons": list(dict.fromkeys(
                      ["latin_darija_pronunciation_not_verified"]
                      + technical["failures"] + technical["warnings"]
                      + (encoded or {}).get("failures", []) + (encoded or {}).get("warnings", []))),
                  "source_script": "latin", "reference_is_synthetic": True,
                  "synthesis_seconds": synthesis_seconds,
                  "rtf": synthesis_seconds / max(technical.get("duration_seconds", 0), 0.001),
                  "reused_master": reused}
        atomic_json(output / "records" / f"{key}.json", record)
        results.append(record)
        attempted.add((job["pilot_id"], job["parameters"]["seed"]))
        atomic_json(output / "report.json", {"model_id": spec["model_id"], "model_revision": spec["revision"],
                    "linguistic_certification": False, "requested_entries": len(jobs), "records": results})
        atomic_json(output / "revision-queue.json", [{"key": r["key"], "entry_id": r.get("entry_id"),
                    "prompt": r["prompt"], "reasons": r["revision_reasons"]}
                    for r in results])
        print(f"[{index}/{len(jobs)}] {job['prompt']} : technique={record['technical_status']}, prononciation=incertaine, reprise={reused}", flush=True)
        retry = job.get("technical_retry", 0)
        if not passed and retry < args.retries:
            parameters = {**job["parameters"], "seed": job["parameters"]["seed"] + 1}
            if (job["pilot_id"], parameters["seed"]) not in attempted:
                pending.insert(0, {**job, "parameters": parameters, "technical_retry": retry + 1,
                                   "key": job_key(job, spec, reference, parameters)})
    accepted = {r["pilot_id"] for r in results if r["technical_status"] == "passed"}
    return 0 if jobs and {j["pilot_id"] for j in jobs} <= accepted else 2


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["plan", "generate"])
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/hadra")
    parser.add_argument("--spec", type=Path, default=ROOT / "docs/hadra/model-inspection.json")
    parser.add_argument("--pilot", type=Path, default=Path(__file__).with_name("pilot-50.json"))
    parser.add_argument("--ids", help="Identifiants du pilote séparés par des virgules")
    parser.add_argument("--scope", choices=["pilot", "words", "all"], default="pilot")
    parser.add_argument("--selection", type=Path)
    parser.add_argument("--exclude-selection", type=Path)
    parser.add_argument("--shard-index", type=int, default=0)
    parser.add_argument("--shard-count", type=int, default=1)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--precision", choices=["auto", "float32", "bfloat16"], default="float32")
    parser.add_argument("--retries", type=int, choices=[0, 1, 2], default=0)
    parser.add_argument("--max-seconds", type=int, default=0)
    parser.add_argument("--variants", type=int, choices=[1, 2, 3], default=1)
    parser.add_argument("--steps", type=int, choices=[8, 16, 32], default=16)
    parser.add_argument("--speed", type=float, default=0.95)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    parser.add_argument("--threads", type=int, default=2)
    args = parser.parse_args()
    if (args.limit is not None and args.limit < 1) or not 0.5 <= args.speed <= 1.2 or args.threads < 1:
        parser.error("Limite positive ; vitesse 0,5–1,2 ; au moins un thread")
    if args.scope == "pilot" and args.limit and args.limit > 50:
        parser.error("Le pilote est limité à 50 entrées")
    if not 0 <= args.shard_index < args.shard_count or args.max_seconds < 0:
        parser.error("Indices de lots ou budget invalides")
    args.precision = resolve_precision(args.device, args.precision)
    output = args.output.resolve()
    if output == (ROOT / "public").resolve() or (ROOT / "public").resolve() in output.parents:
        parser.error("Les candidats HADRA doivent rester hors de public pour protéger l'audio actuel")
    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    catalog = read_catalog()
    ref = catalog["dia-taxi-1"]
    reference_audio = ROOT / "public" / ref["audio"]
    reference = {"audio": ref["audio"], "sha256": file_sha256(reference_audio),
                 "text": latin_prompt(ref["latin"]), "origin": "existing_azure_jamal"}
    jobs = make_jobs(select_records(catalog, args), spec, reference, args)
    output.mkdir(parents=True, exist_ok=True)
    atomic_json(output / "plan.json", {"model_id": spec["model_id"], "revision": spec["revision"],
                "reference": reference, "jobs": jobs, "source_script": "latin",
                "pronunciation_validation": "not_performed"})
    if args.command == "plan":
        pending = sum(cached_record(output, job["key"]) is None for job in jobs)
        print(f"{len(jobs)} candidats ; {pending} synthèses nécessaires")
        return 0
    try:
        return generate(jobs, spec, reference, reference_audio, output, args)
    except Exception as error:
        # Persister le diagnostic même si l'initialisation du modèle échoue.
        # Les URL signées de téléchargement ne doivent pas entrer dans Git.
        atomic_json(output / "error.json", {
            "type": type(error).__name__,
            "message": re.sub(r"https?://[^\s]+", "<download-url>", str(error)),
            "linguistic_certification": False,
        })
        raise


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, KeyError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
