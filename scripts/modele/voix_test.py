"""
Voix de test pour régler le score de prononciation : les mots des paires de sons (9elb / kelb…) dits par
d'autres voix arabes d'Azure que Jamal (femmes, autres pays). Elles ne servent qu'aux tests du score
(src/scoring/sons/), jamais dans l'appli : on vérifie qu'une autre voix qui dit le bon mot passe, et
qu'elle échoue quand elle dit le mot voisin. Lancé par l'Action « Voix de test » (clé Azure en secret).
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import generate_audio as g  # noqa: E402

VOIX = ['ar-MA-MounaNeural', 'ar-EG-SalmaNeural', 'ar-SA-HamedNeural', 'ar-DZ-IsmaelNeural']
DOSSIER = Path(__file__).resolve().parent / 'voix-test'


def main() -> int:
    mots = json.load(open(g.RACINE / 'src' / 'data' / 'sons' / 'paires.json', encoding='utf-8'))['mots']
    echecs = 0
    for voix in VOIX:
        g.VOIX = voix
        taches = [(g.texte_a_lire(m['arabe']), DOSSIER / voix / f"{m['id']}.mp3") for m in mots]
        taches = [(t, c) for t, c in taches if not c.exists()]
        print(f'{voix} : {len(taches)} mot(s) à générer')
        echecs += len(g.generer_azure(taches))
    return 1 if echecs else 0


if __name__ == '__main__':
    sys.exit(main())
