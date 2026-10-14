"""Inspecte les métadonnées publiques de HADRA, sans poids ni exécution de code distant."""

import argparse
import json
import re
import urllib.request
from pathlib import Path

MODEL_ID = "Jip7e/habibi-tts-doda-darija"
MODEL_REVISION = "0f9beec11b1185934e0da95c0e298f1b0457eef4"
VOCODER_ID = "charactr/vocos-mel-24khz"


def read_url(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=30) as response:
        body = response.read(2_000_001)
    if len(body) > 2_000_000:
        raise RuntimeError("Métadonnées trop volumineuses")
    return body


def inspect_model() -> dict:
    metadata = json.loads(read_url(f"https://huggingface.co/api/models/{MODEL_ID}/revision/{MODEL_REVISION}?blobs=true"))
    revision = metadata["sha"]
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("Révision du modèle invalide")
    filenames = {item["rfilename"] for item in metadata.get("siblings", [])}
    wanted = ["README.md", "config.json", "generation_config.json", "tokenizer_config.json",
              "special_tokens_map.json", "preprocessor_config.json", "vocab.json", "vocab.txt",
              "requirements.txt", "pyproject.toml", "LICENSE"]
    files = {}
    for filename in wanted:
        if filename in filenames:
            text = read_url(f"https://huggingface.co/{MODEL_ID}/resolve/{revision}/{filename}").decode("utf-8")
            files[filename] = json.loads(text) if filename.endswith(".json") else text
    vocoder = json.loads(read_url(f"https://huggingface.co/api/models/{VOCODER_ID}?blobs=true"))
    if not re.fullmatch(r"[0-9a-f]{40}", vocoder["sha"]):
        raise ValueError("Révision du vocodeur invalide")
    return {"model_id": MODEL_ID, "revision": revision, "metadata": metadata, "files": files,
            "vocoder": {"model_id": VOCODER_ID, "revision": vocoder["sha"], "metadata": vocoder}}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = inspect_model()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{MODEL_ID}@{report['revision']} : {len(report['files'])} fichiers inspectés")


if __name__ == "__main__":
    main()
