"""Construit un espace autonome d'écoute de 50 vrais mots avant/après."""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

from catalog import ROOT, file_sha256, read_catalog
from collect_corpus import verified_records
from generate import atomic_json


def build(reports: Path, output: Path):
    ids = json.loads((ROOT / "scripts/hadra/review-50.json").read_text())["entry_ids"]
    chosen, _, _ = verified_records(reports)
    missing = set(ids) - set(chosen)
    if missing:
        raise ValueError(f"La comparaison doit contenir 50 nouveaux MP3 conformes ; manquants : {sorted(missing)}")
    output.mkdir(parents=True, exist_ok=True)
    for source in (ROOT / "scripts/hadra/review-site").iterdir():
        shutil.copyfile(source, output / source.name)
    catalog = read_catalog()
    entries = []
    for entry in ids:
        record, after = chosen[entry]
        original = catalog[entry]
        before = ROOT / "public" / original["audio"]
        paths = {"before": f"before/{entry}.mp3", "after": f"after/{entry}-{record['key'][:12]}.mp3"}
        for label, source in [("before", before), ("after", after)]:
            destination = output / paths[label]
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        entries.append({"id": entry, "latin": original["latin"], "arabe": original["arabe"],
                        "fr": original["fr"], "theme": original["theme"], "tts_text": record["prompt"],
                        **paths, "before_sha256": file_sha256(before), "after_sha256": file_sha256(after),
                        "technical_status": record["technical_status"],
                        "warnings": record["revision_reasons"], "pronunciation_status": "uncertain",
                        "model_revision": record["model_revision"], "parameters": record["parameters"]})
    manifest = {"version": 1, "model": "HADRA", "source_script": "latin", "count": 50,
                "linguistic_certification": False, "entries": entries,
                "themes": dict(re.findall(r"id: '([^']+)', titre: '([^']+)'", (ROOT / "src/data/themes.ts").read_text()))}
    manifest["review_id"] = hashlib.sha256(json.dumps(entries, sort_keys=True).encode()).hexdigest()
    atomic_json(output / "manifest.json", manifest)
    (output / "data.js").write_text("window.HADRA_REVIEW = " + json.dumps(manifest, ensure_ascii=False) + ";\n")
    print("50 mots, 100 MP3, page autonome prête")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reports", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    build(args.reports, args.output)
