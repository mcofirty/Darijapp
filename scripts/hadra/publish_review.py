"""Publie seulement les assets de comparaison ; la voix des exercices reste intacte."""
import argparse
import json
import shutil
import subprocess
import time
from pathlib import Path

from catalog import file_sha256, read_catalog


def run(*args, cwd=None):
    return subprocess.check_output(args, cwd=cwd, text=True).strip()


def push_main(checkout):
    for attempt in range(4):
        result = subprocess.run(["git", "push", "origin", "HEAD:main"], cwd=checkout,
                                capture_output=True, text=True)
        if result.returncode == 0:
            return
        if "non-fast-forward" in result.stderr or "fetch first" in result.stderr:
            run("git", "fetch", "origin", "main", cwd=checkout)
            run("git", "rebase", "FETCH_HEAD", cwd=checkout)
        time.sleep(2 * (attempt + 1))
    raise RuntimeError("GitHub a refusé la publication du comparatif après quatre essais")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--checkout", type=Path, required=True)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    checkout = args.checkout.resolve()
    memory = (checkout / "CLAUDE.md").read_text()  # Lecture obligatoire avant toute publication.
    manifest = json.loads((args.site / "manifest.json").read_text())
    current = read_catalog(checkout)
    for entry in manifest["entries"]:
        if current[entry["id"]]["latin"] != entry["latin"]:
            raise ValueError("Le latin de main a changé pendant le calcul ; comparaison à actualiser")
        if file_sha256(checkout / "public" / current[entry["id"]]["audio"]) != entry["before_sha256"]:
            raise ValueError("La voix actuelle a changé pendant le calcul ; comparaison à actualiser")
    destination = checkout / "public/test-audio"
    if destination.exists():
        shutil.rmtree(destination)  # Dossier exclusivement réservé à ce comparatif.
    shutil.copytree(args.site, destination)
    note = "- Test audio HADRA (2026-10-14) : 50 mots avant/après sur `/test-audio/`, cible latine, avis local indépendant de la progression. Voix HADRA expérimentale ; aucun remplacement de `public/audio` ni des références du score. Activation dans les exercices uniquement après décision explicite de l'utilisateur."
    if note not in memory:
        memory = memory.replace("## Points en suspens\n", "## Points en suspens\n\n" + note + "\n")
        if len(memory.splitlines()) >= 300 or len(memory) >= 45000:
            raise ValueError("La mémoire CLAUDE dépasse sa limite")
        (checkout / "CLAUDE.md").write_text(memory)
    history = checkout / "docs/historique.md"
    text = history.read_text()
    row = "| 2026-10-14 | Espace de test audio autonome : 50 mots réels, lecteurs Avant/Jamal et Après/HADRA latin, avis et export local ; voix des exercices conservée | `public/test-audio/` |\n"
    if row not in text:
        text = text.replace("## Décisions", row + "\n## Décisions", 1)
        text += "\n- 2026-10-14 : comparatif HADRA publié dans un sous-dossier autonome du site existant, sans toucher aux MP3 actifs, aux lecteurs ni à IndexedDB ; les contrôles techniques ne certifient pas la prononciation.\n"
        history.write_text(text)
    run("git", "config", "user.name", "github-actions[bot]", cwd=checkout)
    run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com", cwd=checkout)
    run("git", "add", "public/test-audio", "CLAUDE.md", "docs/historique.md", cwd=checkout)
    if run("git", "diff", "--cached", "--name-only", cwd=checkout):
        run("git", "commit", "-m", "test: publie 50 comparaisons vocales sans activer HADRA", cwd=checkout)
        push_main(checkout)
    # Les commits GITHUB_TOKEN ne déclenchent pas les Actions push : dispatch explicite.
    repo = "mcofirty/Darijapp"
    run("gh", "api", "--method", "POST", f"repos/{repo}/actions/workflows/publier.yml/dispatches", "-f", "ref=main")
    print("Comparatif envoyé à Publier : https://mcofirty.github.io/Darijapp/test-audio/")


if __name__ == "__main__":
    main()
