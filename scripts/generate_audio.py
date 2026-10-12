"""Génère les MP3 manquants des mots et des exemples à partir de src/data/*.json.

Modèle : facebook/mms-tts-ara (synthèse vocale arabe).

mms-tts-ara lit l'écriture arabe sans voyelles (champ « arabe »). Si un modèle demande du
texte romanisé (uroman), le script lui donne notre translittération latine convertie
(3 → ', 7 → h, 9 → q, ch → sh, ou → u), qui porte les voyelles du darija.

Seuls les fichiers absents de public/audio/ sont générés, sauf avec --force.
--apercu affiche le texte envoyé au modèle, sans rien générer.

Installation (une seule fois) :
    pip install torch transformers uroman
    + ffmpeg installé sur la machine (brew install ffmpeg sur Mac)

Utilisation :
    python scripts/generate_audio.py                  # tous les thèmes
    python scripts/generate_audio.py --theme chiffres # un seul thème
    python scripts/generate_audio.py --force          # régénère tout
    python scripts/generate_audio.py --apercu         # montre les textes lus
"""

import argparse
import json
import re
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


# Lettres de remplacement quand le modèle ne connaît pas une lettre.
REPLIS = {"e": "a", "o": "u", "g": "k", "p": "b", "v": "f"}


def vers_uroman(latin: str, vocabulaire: set[str] | None = None) -> str:
    """Convertit notre translittération darija en texte romanisé à la manière d'uroman."""
    texte = latin.lower()
    # « ... » et « / » servent à l'affichage ; « — » sépare deux répliques.
    for signe in ("...", "/", "—", "?", "!"):
        texte = texte.replace(signe, ",")
    # 7 après k, s, g ou c formerait kh, sh… (une autre lettre) : on intercale une voyelle brève.
    texte = re.sub(r"([ksgc])7", r"\1a7", texte)
    texte = texte.replace("ch", "sh").replace("ou", "u")
    texte = texte.replace("3", "'").replace("7", "h").replace("9", "q")
    if vocabulaire is None:
        return " ".join(texte.split()).strip(" ,")
    lettres = []
    for c in texte:
        if c in vocabulaire or c == " ":
            lettres.append(c)
        elif REPLIS.get(c) in vocabulaire:
            lettres.append(REPLIS[c])
    return " ".join("".join(lettres).split()).strip(" ,")


def lister_a_generer(theme: str | None, force: bool) -> list[tuple[str, str, Path]]:
    """Renvoie les triplets (latin, arabe, chemin du MP3) à produire."""
    taches = []
    for fichier in sorted(DONNEES.glob("*.json")):
        if theme and fichier.stem != theme:
            continue
        for mot in json.loads(fichier.read_text(encoding="utf-8")):
            ex = mot["exemple"]
            for latin, arabe, audio in ((mot["latin"], mot["arabe"], mot["audio"]), (ex["latin"], ex["arabe"], ex["audio"])):
                cible = PUBLIC / audio
                if force or not cible.exists():
                    taches.append((latin, arabe, cible))
    return taches


def charger_modele():
    import torch  # noqa: F401  (importé ici pour un message d'erreur clair s'il manque)
    from transformers import AutoTokenizer, VitsModel

    tokenizer = AutoTokenizer.from_pretrained(MODELE)
    modele = VitsModel.from_pretrained(MODELE)
    modele.eval()
    return tokenizer, modele


def texte_a_lire(latin: str, arabe: str, tokenizer) -> str:
    """Texte donné au modèle : notre latin s'il lit du romanisé, sinon l'écriture arabe."""
    if getattr(tokenizer, "is_uroman", False):
        return vers_uroman(latin, set(tokenizer.get_vocab()))
    return arabe.replace("...", " ").replace("/", "،").replace("—", "،")


def synthetiser(texte: str, cible: Path, tokenizer, modele) -> None:
    import torch

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
    parser.add_argument("--apercu", action="store_true", help="afficher les textes lus, sans générer")
    args = parser.parse_args()

    taches = lister_a_generer(args.theme, args.force)
    if args.apercu:
        for latin, _, cible in taches:
            print(f"{cible.name:28} {latin:35} → {vers_uroman(latin)}")
        return 0
    if not taches:
        print("Tous les MP3 existent déjà.")
        return 0
    if shutil.which("ffmpeg") is None:
        print("ffmpeg est introuvable : installe-le avant de lancer ce script.", file=sys.stderr)
        return 1

    print(f"{len(taches)} fichier(s) à générer avec {MODELE}…")
    tokenizer, modele = charger_modele()
    vocabulaire = "".join(sorted(tokenizer.get_vocab()))
    print(f"Lecture {'du latin romanisé' if getattr(tokenizer, 'is_uroman', False) else 'de l’arabe'} ; lettres connues : {vocabulaire!r}")
    for i, (latin, arabe, cible) in enumerate(taches, 1):
        texte = texte_a_lire(latin, arabe, tokenizer)
        synthetiser(texte, cible, tokenizer, modele)
        print(f"[{i}/{len(taches)}] {cible.relative_to(RACINE)} ← {texte}")
    print("Terminé. Relance « npm run build » pour que la PWA mette ces fichiers en cache.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
