"""Vérifie un lot de comparaison déjà calculé avant de le réutiliser."""
import argparse
import json
from pathlib import Path
from catalog import latin_prompt, read_catalog
from collect_corpus import verified_records

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--root", type=Path, required=True)
parser.add_argument("--selection", type=Path, required=True)
parser.add_argument("--shard-index", type=int, required=True)
parser.add_argument("--shard-count", type=int, required=True)
args = parser.parse_args()
catalog = read_catalog()
ids = json.loads(args.selection.read_text())["entry_ids"]
ids = sorted(ids, key=lambda entry: (-len(latin_prompt(catalog[entry]["latin"])), entry))
expected = set(ids[args.shard_index::args.shard_count])
records, _, _ = verified_records(args.root)
if set(records) != expected:
    raise ValueError("Le lot déjà calculé ne couvre pas les entrées attendues")
for record, _ in records.values():
    if record["parameters"]["nfe_step"] != 16 or record["parameters"].get("precision", "float32") != "float32":
        raise ValueError("Paramètres de synthèse différents de l'essai retenu")
print(f"{len(records)} MP3 déjà calculés, empreintes et textes vérifiés")
