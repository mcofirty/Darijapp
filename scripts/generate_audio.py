"""Génère les MP3 manquants des mots et des exemples à partir de src/data/*.json.

Voix par défaut : Jamal (ar-MA-JamalNeural), voix neuronale marocaine de Microsoft,
via edge-tts (sans clé). Elle lit l'écriture arabe darija (champ « arabe ») avec un accent
marocain. Les MP3 sont générés une fois puis embarqués dans l'appli, qui reste hors ligne.

Secours : facebook/mms-tts-ara (--moteur mms), modèle libre exécuté en local. Il lit l'arabe
sans voyelles, à la manière de l'arabe standard, et prononce mal une partie du darija.

Seuls les fichiers absents de public/audio/ sont générés, sauf avec --force.
Code de sortie 2 : certains fichiers n'ont pas pu être générés (relancer, ou --moteur mms).

Installation (une seule fois) :
    pip install edge-tts
    pour le secours : pip install torch transformers, et ffmpeg

Utilisation :
    python scripts/generate_audio.py                  # tous les thèmes, voix Jamal
    python scripts/generate_audio.py --theme chiffres # un seul thème
    python scripts/generate_audio.py --force          # régénère tout
    python scripts/generate_audio.py --apercu         # montre les textes lus
    python scripts/generate_audio.py --moteur mms     # voix de secours
"""

import argparse
import asyncio
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
VOIX = "ar-MA-JamalNeural"
MODELE_SECOURS = "facebook/mms-tts-ara"
ESSAIS = 3
EN_PARALLELE = 4
DELAI_MAX = 30  # secondes par fichier : une requête bloquée ne fige pas tout


def texte_a_lire(arabe: str) -> str:
    """« ... », « / » et « — » servent à l'affichage : on les remplace par des pauses."""
    texte = arabe.replace("...", "،").replace("/", "،").replace("—", "،")
    return " ".join(texte.split())


def lister_a_generer(theme: str | None, force: bool) -> list[tuple[str, Path]]:
    """Renvoie les couples (texte arabe à lire, chemin du MP3) à produire."""
    taches = []
    for fichier in sorted(DONNEES.glob("*.json")):
        if theme and fichier.stem != theme:
            continue
        for mot in json.loads(fichier.read_text(encoding="utf-8")):
            ex = mot["exemple"]
            for arabe, audio in ((mot["arabe"], mot["audio"]), (ex["arabe"], ex["audio"])):
                cible = PUBLIC / audio
                if force or not cible.exists():
                    taches.append((texte_a_lire(arabe), cible))
    return taches


async def generer_edge(taches: list[tuple[str, Path]]) -> list[tuple[str, Path]]:
    """Génère avec la voix marocaine ; renvoie les tâches en échec."""
    import edge_tts

    limite = asyncio.Semaphore(EN_PARALLELE)
    echecs: list[tuple[str, Path]] = []
    faits = 0

    async def une(texte: str, cible: Path) -> None:
        nonlocal faits
        async with limite:
            for essai in range(1, ESSAIS + 1):
                try:
                    cible.parent.mkdir(parents=True, exist_ok=True)
                    temporaire = cible.with_suffix(".tmp")
                    await asyncio.wait_for(edge_tts.Communicate(texte, VOIX).save(str(temporaire)), DELAI_MAX)
                    if temporaire.stat().st_size == 0:
                        raise RuntimeError("fichier vide")
                    temporaire.replace(cible)
                    faits += 1
                    print(f"[{faits}/{len(taches)}] {cible.relative_to(RACINE)} ← {texte}")
                    return
                except Exception as erreur:  # réseau, limite de débit…
                    temporaire.unlink(missing_ok=True)
                    print(f"  essai {essai}/{ESSAIS} raté pour {cible.name} : {erreur}", file=sys.stderr)
                    await asyncio.sleep(2 * essai)
            echecs.append((texte, cible))

    # Essai sur un premier fichier : si le service refuse (ex. 403), inutile d'insister sur les autres.
    premier, reste = taches[0], taches[1:]
    await une(*premier)
    if echecs:
        print("La voix marocaine ne répond pas : abandon, le secours prendra le relais.", file=sys.stderr)
        return echecs + list(reste)
    await asyncio.gather(*(une(t, c) for t, c in reste))
    return echecs


def generer_mms(taches: list[tuple[str, Path]]) -> None:
    """Voix de secours, exécutée en local."""
    import torch
    from transformers import AutoTokenizer, VitsModel

    if shutil.which("ffmpeg") is None:
        raise SystemExit("ffmpeg est introuvable : installe-le avant d'utiliser --moteur mms.")
    tokenizer = AutoTokenizer.from_pretrained(MODELE_SECOURS)
    modele = VitsModel.from_pretrained(MODELE_SECOURS)
    modele.eval()
    for i, (texte, cible) in enumerate(taches, 1):
        with torch.no_grad():
            onde = modele(**tokenizer(texte, return_tensors="pt")).waveform[0].numpy()
        cible.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            chemin_wav = Path(tmp.name)
        with wave.open(str(chemin_wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(modele.config.sampling_rate)
            w.writeframes((onde.clip(-1, 1) * 32767).astype("<i2").tobytes())
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(chemin_wav), "-codec:a", "libmp3lame", "-b:a", "64k", str(cible)],
            check=True,
        )
        chemin_wav.unlink()
        print(f"[{i}/{len(taches)}] {cible.relative_to(RACINE)} ← {texte}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--theme", help="ne traiter qu'un thème (nom du fichier JSON sans extension)")
    parser.add_argument("--force", action="store_true", help="régénérer même les MP3 existants")
    parser.add_argument("--apercu", action="store_true", help="afficher les textes lus, sans générer")
    parser.add_argument("--moteur", choices=["edge", "mms"], default="edge", help="voix marocaine (edge) ou secours (mms)")
    args = parser.parse_args()

    taches = lister_a_generer(args.theme, args.force)
    if args.apercu:
        for texte, cible in taches:
            print(f"{cible.name:28} {texte}")
        return 0
    if not taches:
        print("Tous les MP3 existent déjà.")
        return 0

    if args.moteur == "mms":
        print(f"{len(taches)} fichier(s) à générer avec {MODELE_SECOURS}…")
        generer_mms(taches)
        return 0

    print(f"{len(taches)} fichier(s) à générer avec la voix {VOIX}…")
    echecs = asyncio.run(generer_edge(taches))
    if echecs:
        print(f"{len(echecs)} fichier(s) non générés : {', '.join(c.name for _, c in echecs)}", file=sys.stderr)
        return 2
    print("Terminé.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
