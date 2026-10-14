"""Catalogue latin partagé par la planification et la synthèse HADRA."""

import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NORMALIZATION_VERSION = 1


def latin_prompt(text: str) -> str:
    text = unicodedata.normalize("NFC", text).strip()
    if not text or re.search(r"[\u0600-\u06ff]", text):
        raise ValueError("La cible TTS doit être écrite en latin darija, jamais remplacée par l'arabe")
    # Les chiffres Arabizi et les consonnes doublées restent inchangés.
    return " ".join(text.replace("...", ",").replace("—", ",").replace("/", ",").split())


def read_catalog(root: Path = ROOT) -> dict[str, dict]:
    entries = {}

    def walk(value, source, parent_id=""):
        if isinstance(value, list):
            for item in value:
                walk(item, source, parent_id)
        elif isinstance(value, dict):
            entry_id = value.get("id", parent_id)
            if value.get("audio") and isinstance(value.get("latin"), str):
                audio = value["audio"]
                if not re.fullmatch(r"audio/[A-Za-z0-9_-]+\.mp3", audio):
                    raise ValueError(f"Chemin audio non pris en charge : {audio}")
                record = {"entry_id": audio.removeprefix("audio/").removesuffix(".mp3"),
                          "app_id": entry_id, "audio": audio, "latin": value["latin"],
                          "arabe": value.get("arabe", ""), "source": source}
                if record["entry_id"] in entries and entries[record["entry_id"]] != record:
                    raise ValueError(f"Audio partagé par des textes différents : {audio}")
                entries[record["entry_id"]] = record
            for key, item in value.items():
                if isinstance(item, (dict, list)):
                    walk(item, source, entry_id)

    for path in sorted((root / "src/data").rglob("*.json")):
        walk(json.loads(path.read_text(encoding="utf-8")), str(path.relative_to(root)))
    return entries


def read_pilot(catalog: dict[str, dict], path: Path) -> list[dict]:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    result = []
    for item in manifest["entries"]:
        if "entry_id" in item:
            record = {**catalog[item["entry_id"]], **item}
            record["prompt"] = latin_prompt(catalog[item["entry_id"]]["latin"])
        else:
            record = {**item, "prompt": latin_prompt(item["latin"]), "audio": None, "source": "constructed_pilot"}
        result.append(record)
    if len(result) != 50 or len({item["pilot_id"] for item in result}) != 50:
        raise ValueError("Le pilote doit comporter exactement 50 entrées distinctes")
    return result


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def job_key(record: dict, spec: dict, reference: dict, parameters: dict) -> str:
    payload = {"prompt": record["prompt"], "kind": record["kind"],
               "model": spec["revision"], "vocoder": spec["vocoder"]["revision"],
               "reference": reference, "parameters": parameters,
               "normalization": NORMALIZATION_VERSION, "engine": "f5-tts==1.1.22"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
