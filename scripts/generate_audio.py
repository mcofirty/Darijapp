"""Génère les MP3 manquants des mots et des exemples à partir de src/data/*.json.

Modèle : facebook/mms-tts-ara (synthèse vocale arabe), lu à partir du champ « arabe ».
Seuls les fichiers absents de public/audio/ sont générés, sauf avec --force.

Installation (une seule fois) :
    pip install torch transformers uroman
    + ffmpeg installé sur la machine (brew install ffmpeg sur Mac)

Utilisation :
    python scripts/generate_audio.py                  # tous les thèmes
    python scripts/generate_audio.py --theme chiffres # un seul thème
    python scripts/generate_audio.py --force          # régénère tout
"""

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DONNEES = RACINE / "src" / "data"
PUBLIC = RACINE / "public"
MODELE = "facebook/mms-tts-ara"


def lister_a_generer(theme: str | None, force: bool) -> list[tuple[str, Path]]:
    """Renvoie les couples (texte arabe, chemin du MP3) à produire."""
    taches = []
    for fichier in sorted(DONNEES.glob("*.json")):
        if theme and fichier.stem != theme:
            continue
        for mot in json.loads(fichier.read_text(encoding="utf-8")):
            for arabe, audio in ((mot["arabe"], mot["audio"]), (mot["exemple"]["arabe"], mot["exemple"]["audio"])):
                cible = PUBLIC / audio
                if force or not cible.exists():
                    # « ... » et « / » servent à l'affichage : on ne les lit pas.
                    texte = arabe.replace("...", " ").replace("/", "،").replace("—", "،")
                    taches.append((texte, cible))
    return taches


def charger_modele():
    import torch  # noqa: F401  (importé ici pour un message d'erreur clair s'il manque)
    from transformers import AutoTokenizer, VitsModel

    tokenizer = AutoTokenizer.from_pretrained(MODELE)
    modele = VitsModel.from_pretrained(MODELE)
    modele.eval()
    romaniseur = None
    if getattr(tokenizer, "is_uroman", False):
        import uroman

        romaniseur = uroman.Uroman()
    return tokenizer, modele, romaniseur


def synthetiser(texte: str, cible: Path, tokenizer, modele, romaniseur) -> None:
    import torch

    if romaniseur is not None:
        texte = romaniseur.romanize_string(texte)
    entrees = tokenizer(texte, return_tensors="pt")
    with torch.no_grad():
        onde = modele(**entrees).waveform[0].numpy()

    echantillons = (onde.clip(-1, 1) * 32767).astype("<i2").tobytes()
    cible.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        chemin_wav = Path(tmp.name)
    with wave.open(str(chemin_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(modele.config.sampling_rate)
        w.writeframes(echantillons)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(chemin_wav), "-codec:a", "libmp3lame", "-b:a", "64k", str(cible)],
        check=True,
    )
    chemin_wav.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--theme", help="ne traiter qu'un thème (nom du fichier JSON sans extension)")
    parser.add_argument("--force", action="store_true", help="régénérer même les MP3 existants")
    args = parser.parse_args()

    taches = lister_a_generer(args.theme, args.force)
    if not taches:
        print("Tous les MP3 existent déjà.")
        return 0
    if shutil.which("ffmpeg") is None:
        print("ffmpeg est introuvable : installe-le avant de lancer ce script.", file=sys.stderr)
        return 1

    print(f"{len(taches)} fichier(s) à générer avec {MODELE}…")
    tokenizer, modele, romaniseur = charger_modele()
    for i, (texte, cible) in enumerate(taches, 1):
        synthetiser(texte, cible, tokenizer, modele, romaniseur)
        print(f"[{i}/{len(taches)}] {cible.relative_to(RACINE)}")
    print("Terminé. Relance « npm run build » pour que la PWA mette ces fichiers en cache.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
