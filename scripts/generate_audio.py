"""Génère les MP3 manquants des mots et des exemples (src/data/*.json), des paires de sons (src/data/sons/paires.json), des phrases du marchandage (src/data/jeux/marchandage.json), des leçons de grammaire (src/data/parler/grammaire.json) et des dialogues (src/data/parler/dialogues.json, avec la version au féminin des répliques).

Voix par défaut : Jamal (ar-MA-JamalNeural), voix neuronale marocaine de Microsoft, par l'API
officielle Azure Speech (offre gratuite F0). Elle lit l'écriture arabe darija (champ « arabe »)
avec un accent marocain. Les MP3 sont générés une fois puis embarqués dans l'appli.
Variables d'environnement : AZURE_SPEECH_KEY et AZURE_SPEECH_REGION (secrets GitHub ; ne jamais
les écrire dans le repo, qui est public).

Secours : facebook/mms-tts-ara (--moteur mms), modèle libre exécuté en local. Il lit l'arabe
sans voyelles, à la manière de l'arabe standard, et prononce mal une partie du darija.

Seuls les fichiers absents de public/audio/ sont générés, sauf avec --force. Les entrées au champ
« audio » vide (mots importés) sont ignorées : la voix du téléphone les lit.
Code de sortie 2 : certains fichiers n'ont pas pu être générés (relancer : seuls les manquants le sont).
Aucune dépendance pour Azure. Secours (--moteur mms) : pip install torch transformers, et ffmpeg.

Utilisation :
    python scripts/generate_audio.py                  # tous les thèmes, voix Jamal (Azure)
    python scripts/generate_audio.py --theme chiffres # un seul thème
    python scripts/generate_audio.py --force          # régénère tout
    python scripts/generate_audio.py --apercu         # montre les textes lus
    python scripts/generate_audio.py --moteur mms     # voix de secours
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path
from xml.sax.saxutils import escape

RACINE = Path(__file__).resolve().parent.parent
DONNEES = RACINE / "src" / "data"
PUBLIC = RACINE / "public"
VOIX = "ar-MA-JamalNeural"
MODELE_SECOURS = "facebook/mms-tts-ara"
FORMAT_MP3 = "audio-24khz-48kbitrate-mono-mp3"
ESSAIS = 3
INTERVALLE = 3.2  # secondes entre deux requêtes : l'offre gratuite F0 accepte 20 requêtes par minute
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
                if not audio:  # entrée sans MP3 : lue par la voix du téléphone
                    continue
                cible = PUBLIC / audio
                if force or not cible.exists():
                    taches.append((texte_a_lire(arabe), cible))
    # Mots des paires de « Distingue les sons » (9elb / kelb…), phrases du marchandage, de la grammaire et des dialogues.
    if not theme:
        autres = json.loads((DONNEES / "sons" / "paires.json").read_text(encoding="utf-8"))["mots"]
        for article in json.loads((DONNEES / "jeux" / "marchandage.json").read_text(encoding="utf-8"))["articles"]:
            autres += article["prix"]
        for lecon in json.loads((DONNEES / "parler" / "grammaire.json").read_text(encoding="utf-8"))["lecons"]:
            autres += lecon["formes"]
        dialogues = DONNEES / "parler" / "dialogues.json"
        if dialogues.exists():
            for scene in json.loads(dialogues.read_text(encoding="utf-8"))["scenes"]:
                for replique in scene["repliques"]:
                    autres.append(replique)
                    if "feminin" in replique:
                        autres.append(replique["feminin"])
        for mot in autres:
            cible = PUBLIC / mot["audio"]
            if force or not cible.exists():
                taches.append((texte_a_lire(mot["arabe"]), cible))
    return taches


def generer_azure(taches: list[tuple[str, Path]]) -> list[tuple[str, Path]]:
    """Génère avec la voix marocaine Jamal (Azure Speech) ; renvoie les tâches en échec.

    L'offre gratuite F0 limite à 20 requêtes par minute : on espace donc les appels.
    La clé et la région viennent de AZURE_SPEECH_KEY et AZURE_SPEECH_REGION (secrets GitHub).
    """
    cle = os.environ.get("AZURE_SPEECH_KEY", "").strip()
    region = os.environ.get("AZURE_SPEECH_REGION", "").strip().lower().replace(" ", "")
    if not cle or not region:
        print("AZURE_SPEECH_KEY et AZURE_SPEECH_REGION sont absents : rien n'est généré.", file=sys.stderr)
        return list(taches)
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    entetes = {
        "Ocp-Apim-Subscription-Key": cle,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": FORMAT_MP3,
        "User-Agent": "darijaapp",
    }
    echecs: list[tuple[str, Path]] = []
    for i, (texte, cible) in enumerate(taches, 1):
        ssml = (
            f"<speak version='1.0' xml:lang='{VOIX[:5]}'><voice xml:lang='{VOIX[:5]}' name='{VOIX}'>"
            f"{escape(texte)}</voice></speak>"
        ).encode("utf-8")
        for essai in range(1, ESSAIS + 1):
            debut = time.monotonic()
            try:
                requete = urllib.request.Request(url, data=ssml, headers=entetes, method="POST")
                with urllib.request.urlopen(requete, timeout=DELAI_MAX) as reponse:
                    audio = reponse.read()
                if not audio:
                    raise RuntimeError("fichier vide")
                cible.parent.mkdir(parents=True, exist_ok=True)
                temporaire = cible.with_suffix(".tmp")
                temporaire.write_bytes(audio)
                temporaire.replace(cible)
                print(f"[{i}/{len(taches)}] {cible.relative_to(RACINE)} ← {texte}", flush=True)
                break
            except urllib.error.HTTPError as erreur:
                if erreur.code in (401, 403) or (i == 1 and erreur.code in (400, 404)):
                    # Clé, région ou quota refusés : inutile d'insister sur les autres fichiers.
                    print(f"Azure refuse la requête (HTTP {erreur.code}) : {erreur.reason}. Abandon.", file=sys.stderr)
                    return echecs + list(taches[i - 1 :])
                attente = int(erreur.headers.get("Retry-After", "30")) if erreur.code == 429 else 5 * essai
                print(f"  essai {essai}/{ESSAIS} raté pour {cible.name} : HTTP {erreur.code}, pause {attente} s", file=sys.stderr)
                time.sleep(attente)
            except Exception as erreur:  # réseau, délai dépassé…
                print(f"  essai {essai}/{ESSAIS} raté pour {cible.name} : {erreur}", file=sys.stderr)
                time.sleep(5 * essai)
        else:
            echecs.append((texte, cible))
            continue
        # Respecte la limite de l'offre gratuite (20 requêtes par minute).
        time.sleep(max(0.0, INTERVALLE - (time.monotonic() - debut)))
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
    parser.add_argument("--moteur", choices=["azure", "mms"], default="azure", help="voix marocaine Azure ou secours local (mms)")
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
    echecs = generer_azure(taches)
    if echecs:
        print(f"{len(echecs)} fichier(s) non générés : {', '.join(c.name for _, c in echecs)}", file=sys.stderr)
        return 2
    print("Terminé.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
