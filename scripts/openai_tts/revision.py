"""Reprend quatre mots et conserve les six autres MP3 octet pour octet."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

import pilot

CONFIG = pilot.ROOT / "scripts/openai_tts/revision-2.json"
REVISED = {"nourriture-001", "chiffres-017", "verbes-085", "adjectifs-052"}


def revision_plan(baseline_site):
    config = json.loads(CONFIG.read_text())
    if config["revision"] != 2 or set(config["instruction_overrides"]) != REVISED:
        raise pilot.PilotError("revision_must_only_change_four_selected_words")
    baseline = json.loads((baseline_site / "manifest.json").read_text())
    current = pilot.plan()
    if (baseline["review_id"] != config["baseline_review_id"]
            or baseline["model"] != current["model"] or baseline["voice"] != current["voice"]
            or baseline["instructions"] != pilot.INSTRUCTIONS.read_text().strip()
            or baseline["source_script"] != "latin" or baseline["count"] != 10):
        raise pilot.PilotError("wrong_revision_baseline")
    originals = {e["id"]: e for e in baseline["entries"]}
    if len(originals) != 10 or set(originals) != {e["entry_id"] for e in current["entries"]}:
        raise pilot.PilotError("baseline_entry_mismatch")
    for entry in current["entries"]:
        original = originals[entry["entry_id"]]
        if original["latin"] != entry["latin"] or original["before_sha256"] != entry["before_sha256"]:
            raise pilot.PilotError("baseline_text_or_current_voice_changed")
        after = (baseline_site / original["after"]).resolve()
        if baseline_site.resolve() not in after.parents or pilot.file_sha256(after) != original["after_sha256"]:
            raise pilot.PilotError("baseline_audio_integrity_failed")
        if entry["entry_id"] in REVISED:
            entry["request"]["instructions"] += "\n\n" + config["instruction_overrides"][entry["entry_id"]]
            entry["key"] = hashlib.sha256(json.dumps({"request": entry["request"], "version": pilot.VERSION},
                                                      sort_keys=True, ensure_ascii=False).encode()).hexdigest()
            entry["previous_sha256"] = original["after_sha256"]
        else:
            entry["retained_sha256"] = original["after_sha256"]
    current.update(revision=2, revised_ids=sorted(REVISED), maximum_paid_requests=4,
                   baseline_review_id=baseline["review_id"])
    return current


def seed(baseline_site, output, current):
    from quality import verify_encoded
    output = pilot.output_path(output)
    baseline = json.loads((baseline_site / "manifest.json").read_text())
    originals = {e["id"]: e for e in baseline["entries"]}
    for entry in current["entries"]:
        original = originals[entry["entry_id"]]
        source = baseline_site / original["after"]
        metrics = verify_encoded(source, "word")
        if not metrics["passed"]:
            raise pilot.PilotError("baseline_audio_not_technically_ready")
        if entry["entry_id"] in REVISED:
            destination = output / "previous" / f"{entry['entry_id']}.mp3"
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
            continue
        basename = f"{entry['entry_id']}-{entry['key'][:12]}"
        path = output / "records" / f"{basename}.json"
        if path.exists():
            saved = json.loads(path.read_text())
            if saved.get("mp3_sha256") != original["after_sha256"]:
                raise pilot.PilotError("retained_candidate_mismatch")
            continue  # Generate verifies the actual cached files before using them.
        for folder in ["raw", "audio"]:
            destination = output / folder / f"{basename}.mp3"
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        pilot.atomic_json(path, {"entry_id": entry["entry_id"], "key": entry["key"],
                                 "latin": entry["latin"], "prompt": entry["request"]["input"],
                                 "model": current["model"], "voice": current["voice"],
                                 "source_script": "latin", "technical_status": "passed",
                                 "pronunciation_status": "uncertain", "confidence": None,
                                 "raw_origin": "technically_checked_review_mp3",
                                 "raw_sha256": original["after_sha256"], "raw_quality": metrics,
                                 "mp3": f"audio/{basename}.mp3", "mp3_sha256": original["after_sha256"],
                                 "encoded_quality": metrics, "instructions": entry["request"]["instructions"],
                                 "imported_from_review": baseline["review_id"], "api_synthesized": False})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["generate", "review"])
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--reports", type=Path, default=pilot.ROOT / "artifacts/openai-revision-2")
    parser.add_argument("--output", type=Path, default=pilot.ROOT / "artifacts/openai-review")
    args = parser.parse_args()
    current = revision_plan(args.baseline.resolve())
    if args.command == "generate":
        seed(args.baseline.resolve(), args.reports, current)
        pilot.generate(args.reports, pilot_plan=current, new_entry_ids=REVISED, max_new_requests=4)
    else:
        pilot.build_review(args.reports, args.output, pilot_plan=current)
