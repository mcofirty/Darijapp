"""Vérifie et rassemble les MP3 des lots ; aucune promotion de prononciation."""
import argparse
import json
import shutil
from pathlib import Path

from catalog import ROOT, file_sha256, latin_prompt, read_catalog
from generate import atomic_json


def verified_records(reports: Path):
    catalog = read_catalog()
    spec = json.loads((ROOT / "docs/hadra/model-inspection.json").read_text())
    chosen, attempted, rejected = {}, set(), []
    for path in sorted(reports.rglob("report.json")):
        report = json.loads(path.read_text())
        if report["model_revision"] != spec["revision"]:
            raise ValueError("Révision de modèle inattendue")
        for record in report["records"]:
            entry = record.get("entry_id")
            if entry not in catalog or record["prompt"] != latin_prompt(catalog[entry]["latin"]):
                raise ValueError(f"Le texte du candidat ne correspond pas au catalogue : {entry}")
            if record["source_script"] != "latin" or record["pronunciation_status"] != "uncertain":
                raise ValueError("Script ou statut linguistique inattendu")
            attempted.add(entry)
            if record["technical_status"] != "passed" or not record.get("mp3"):
                rejected.append(record)
                continue
            mp3 = (path.parent / record["mp3"]).resolve()
            if path.parent.resolve() not in mp3.parents or file_sha256(mp3) != record["mp3_sha256"]:
                raise ValueError(f"Intégrité du MP3 incorrecte : {entry}")
            chosen[entry] = (record, mp3)
    return chosen, attempted, rejected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reports", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    chosen, attempted, rejected = verified_records(args.reports)
    catalog = read_catalog()
    rows = []
    for entry, (record, mp3) in sorted(chosen.items()):
        destination = args.output / "audio" / f"{entry}-{record['key'][:12]}.mp3"
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(mp3, destination)
        rows.append({**record, "library_mp3": str(destination.relative_to(args.output))})
    missing = sorted(set(catalog) - set(chosen))
    summary = {"expected": len(catalog), "attempted": len(attempted), "ready": len(chosen),
               "missing": missing, "complete": not missing, "linguistic_certification": False}
    atomic_json(args.output / "summary.json", summary)
    atomic_json(args.output / "manifest.json", {"summary": summary, "records": rows})
    atomic_json(args.output / "rejected.json", rejected)
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
