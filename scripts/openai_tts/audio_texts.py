"""Référentiel de textes audio par entrée, indépendant des champs affichés."""
import argparse
import hashlib
import json
import re
from pathlib import Path

import phonetic

OVERRIDES = phonetic.ROOT / "scripts/openai_tts/audio-text-overrides.json"


def audio_catalog(catalog=None, overrides=None):
    catalog = catalog if catalog is not None else phonetic.read_catalog()
    overrides = overrides if overrides is not None else json.loads(OVERRIDES.read_text())["entries"]
    if set(overrides) - set(catalog):
        raise ValueError("Une exception phonétique vise une entrée inconnue")
    entries = {}
    vocabulary = set(json.loads(phonetic.LEXICON.read_text())["arabizi_tokens"])
    for entry_id, source in sorted(catalog.items()):
        proposals = {profile: phonetic.convert(source["latin"], profile, vocabulary) for profile in phonetic.PROFILES}
        targets = {profile: proposal["tts_text"] for profile, proposal in proposals.items()}
        origin = "consonant_rules_v1"
        if entry_id in overrides:
            override = overrides[entry_id]
            if override["latin"] != source["latin"]:
                raise ValueError("Exception phonétique périmée : le latin affiché a changé")
            for profile, text in override["audio_text"].items():
                if profile not in phonetic.PROFILES or not isinstance(text, str) or not text.strip():
                    raise ValueError("Exception phonétique invalide")
                if re.search(r"[\u0600-\u06ff]", text):
                    raise ValueError("Une exception TTS ne doit pas remplacer le latin par l’arabe")
                if re.search(r"[A-Za-z][2379]|[2379][A-Za-z]", text):
                    raise ValueError("Une exception ne doit pas réintroduire des chiffres dans les mots")
                targets[profile] = text
            origin = "word_override"
        entries[entry_id] = {"latin": source["latin"], "audio_text": targets, "origin": origin,
                             "status": "needs_lexical_review" if any(t is None for t in targets.values()) else "candidate"}
    source = [(entry_id, entry["latin"]) for entry_id, entry in entries.items()]
    return {"version": 1, "source_sha256": hashlib.sha256(json.dumps(source, ensure_ascii=False).encode()).hexdigest(),
            "linguistic_certification": False, "complete_ipa": False, "confidence": None,
            "display_fields_modified": False, "entries": entries}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = audio_catalog()
    phonetic.atomic_json(args.output, result)
    print(f"{len(result['entries'])} textes audio distincts de l’affichage ; propositions non certifiées.")
