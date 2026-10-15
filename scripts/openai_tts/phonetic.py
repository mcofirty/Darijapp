"""Texte TTS distinct du latin affiché : notation consonantique, pas IPA complet."""
import argparse
import collections
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/hadra"))
from catalog import read_catalog, corpus_records, atomic_json

LEXICON = ROOT / "scripts/openai_tts/arabizi-lexicon.json"
PROFILES = {
    "latin_phonetic": {"2": "ʾ", "3": "ʿ", "7": "ḥ", "9": "q"},
    "consonant_symbols": {"2": "ʔ", "3": "ʕ", "7": "ħ", "9": "q"},
}
NUMERIC_IDENTIFIERS = {"mp3", "mp4", "2g", "3g", "4g", "5g", "usb2", "usb3", "wifi6", "wifi7"}


def convert(text, profile="latin_phonetic", vocabulary=None):
    if profile not in PROFILES:
        raise ValueError("Unknown phonetic profile")
    text = unicodedata.normalize("NFC", text)
    if re.search(r"[\u0600-\u06ff]", text):
        raise ValueError("Le texte TTS doit rester en écriture latine ou phonétique")
    if vocabulary is None:
        vocabulary = set(json.loads(LEXICON.read_text())["arabizi_tokens"])
    replacements, numbers, ambiguous = [], [], []

    def token(match):
        original = match.group()
        lower = original.casefold()
        if not any(c.isdigit() for c in original):
            return original
        if original.isdigit() or lower in NUMERIC_IDENTIFIERS:
            numbers.append(original)
            return original
        if lower not in vocabulary or any(c.isdigit() and c not in "2379" for c in original):
            ambiguous.append(original)
            return original
        converted = "".join(PROFILES[profile].get(c, c) for c in original)
        replacements.append({"source": original, "target": converted})
        return converted

    result = re.sub(r"\w+", token, text)
    if profile == "consonant_symbols":
        # Vowels are deliberately unchanged: this is not a complete IPA transcription.
        result = re.sub(r"kh|gh|ch", lambda m: {"kh": "x", "gh": "ɣ", "ch": "ʃ"}[m.group()], result)
    return {"display_latin": text, "tts_text": None if ambiguous else result,
            "profile": profile, "notation_version": 1, "replacements": replacements,
            "preserved_numbers": numbers, "ambiguous_tokens": ambiguous,
            "status": "needs_lexical_review" if ambiguous else "prepared_not_validated",
            "complete_ipa": False, "linguistic_certification": False, "confidence": None}


def audit():
    catalog = read_catalog()
    lexicon = json.loads(LEXICON.read_text())
    vocabulary = set(lexicon["arabizi_tokens"])
    words = corpus_records(catalog, "words")
    all_entries = corpus_records(catalog, "all")
    affected = [e for e in all_entries if re.search("[2379]", e["latin"])]
    entries = [{"entry_id": e["entry_id"], "kind": e["kind"], "source": e["source"],
                "latin": e["latin"], "proposals": {p: convert(e["latin"], p, vocabulary) for p in PROFILES}}
               for e in affected]
    source = [(e["entry_id"], e["latin"]) for e in sorted(catalog.values(), key=lambda e: e["entry_id"])]
    source_sha = hashlib.sha256(json.dumps(source, ensure_ascii=False).encode()).hexdigest()
    return {"version": 1, "word_count": len(words), "audio_text_count": len(all_entries),
            "words_with_arabizi": sum(bool(re.search('[2379]', e['latin'])) for e in words),
            "audio_texts_with_arabizi": len(affected), "known_arabizi_tokens": len(vocabulary),
            "digit_occurrences": dict(collections.Counter(c for e in all_entries for c in e["latin"] if c.isdigit())),
            "standalone_numbers": sum(bool(re.search(r'(?<!\w)\d+(?!\w)', e['latin'])) for e in all_entries),
            "source_sha256": source_sha, "lexicon_source_matches": source_sha == lexicon["source_sha256"],
            "blocked_proposals": sum(p['tts_text'] is None for e in entries for p in e['proposals'].values()),
            "risk_is_not_confirmed_error": True, "linguistic_certification": False, "entries": entries}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text")
    parser.add_argument("--profile", choices=PROFILES, default="latin_phonetic")
    parser.add_argument("--audit-output", type=Path)
    args = parser.parse_args()
    if args.audit_output:
        report = audit()
        atomic_json(args.audit_output, report)
        print(json.dumps({k: v for k, v in report.items() if k != 'entries'}, ensure_ascii=False))
    elif args.text:
        print(json.dumps(convert(args.text, args.profile), ensure_ascii=False, indent=2))
    else:
        parser.error("Choisir --text ou --audit-output")
