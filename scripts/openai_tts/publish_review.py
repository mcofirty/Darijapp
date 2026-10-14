"""Publie uniquement le test OpenAI de dix mots, après lecture de CLAUDE.md."""
import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "hadra"))
from catalog import file_sha256, read_catalog


def run(*args, cwd=None):
    return subprocess.check_output(args, cwd=cwd, text=True).strip()


def verify(site, checkout):
    manifest = json.loads((site / "manifest.json").read_text())
    if (manifest.get("count") != 10 or len(manifest["entries"]) != 10
            or manifest.get("model") != "gpt-4o-mini-tts-2025-12-15"
            or manifest.get("voice") != "cedar" or manifest.get("source_script") != "latin"
            or manifest.get("linguistic_certification") is not False
            or len({e["id"] for e in manifest["entries"]}) != 10):
        raise ValueError("Le comparatif OpenAI doit contenir exactement dix candidats du pilote")
    catalog = read_catalog(checkout)
    for entry in manifest["entries"]:
        current = catalog[entry["id"]]
        if current["latin"] != entry["latin"] or entry["tts_text"] != entry["latin"]:
            raise ValueError("Le latin a changé ; ne pas publier un comparatif périmé")
        if entry["technical_status"] != "passed" or entry["pronunciation_status"] != "uncertain":
            raise ValueError("Candidat incomplet ou validation linguistique indue")
        if file_sha256(checkout / "public" / current["audio"]) != entry["before_sha256"]:
            raise ValueError("La voix actuelle a changé ; comparaison à actualiser")
        for label in ["before", "after"]:
            path = (site / entry[label]).resolve()
            if site.resolve() not in path.parents or file_sha256(path) != entry[f"{label}_sha256"]:
                raise ValueError("L’intégrité des MP3 du comparatif n’est pas établie")
    return manifest


def publish(site, checkout):
    memory = (checkout / "CLAUDE.md").read_text()  # Obligatoire avant toute publication.
    verify(site, checkout)
    destination = checkout / "public/test-audio-openai"
    if destination.exists():
        shutil.rmtree(destination)  # Sous-dossier réservé à ce seul test.
    shutil.copytree(site, destination)
    note = "- Test vocal OpenAI (2026-10-14) : dix mots difficiles sur `/test-audio-openai/`, Cedar lisant le latin, avis locaux ; les MP3 passent les contrôles techniques sans certification de prononciation. Jamal reste active ; attendre l’avis sur ce pilote avant un essai de 50 mots. HADRA a été refusée et son corpus arrêté."
    if note not in memory:
        memory = memory.replace("## Points en suspens\n", "## Points en suspens\n\n" + note + "\n", 1)
        if len(memory.splitlines()) >= 300 or len(memory) >= 45000:
            raise ValueError("CLAUDE.md dépasse sa limite")
        (checkout / "CLAUDE.md").write_text(memory)
    history = checkout / "docs/historique.md"
    text = history.read_text()
    row = "| 2026-10-14 | Comparatif OpenAI autonome de dix mots, voix Cedar depuis le latin, vingt MP3 et avis locaux ; Jamal conservée dans les exercices | `public/test-audio-openai/` |\n"
    if row not in text:
        text = text.replace("## Décisions", row + "\n## Décisions", 1)
        text += "\n- 2026-10-14 : après refus de HADRA, essai limité à dix mots avec OpenAI ; aucun changement de voix dans les exercices ni génération massive. La préférence d’écoute ne vaut pas certification linguistique.\n"
        history.write_text(text)
    run("git", "config", "user.name", "github-actions[bot]", cwd=checkout)
    run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com", cwd=checkout)
    run("git", "add", "public/test-audio-openai", "CLAUDE.md", "docs/historique.md", cwd=checkout)
    paths = run("git", "diff", "--cached", "--name-only", cwd=checkout).splitlines()
    if any(p not in ["CLAUDE.md", "docs/historique.md"] and not p.startswith("public/test-audio-openai/") for p in paths):
        raise ValueError("Le commit contiendrait des changements hors du comparatif")
    if paths:
        run("git", "commit", "-m", "test: publie dix comparaisons OpenAI sans changer la voix active", cwd=checkout)
        for attempt in range(4):
            verify(site, checkout)
            result = subprocess.run(["git", "push", "origin", "HEAD:main"], cwd=checkout, capture_output=True, text=True)
            if result.returncode == 0:
                break
            if "non-fast-forward" in result.stderr or "fetch first" in result.stderr:
                run("git", "fetch", "origin", "main", cwd=checkout)
                run("git", "rebase", "FETCH_HEAD", cwd=checkout)
                (checkout / "CLAUDE.md").read_text()
            time.sleep(2 * (attempt + 1))
        else:
            raise RuntimeError("Publication refusée par GitHub après quatre essais")
    run("gh", "api", "--method", "POST", "repos/mcofirty/Darijapp/actions/workflows/publier.yml/dispatches", "-f", "ref=main")
    print("Test envoyé à Publier : https://mcofirty.github.io/Darijapp/test-audio-openai/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--checkout", type=Path, required=True)
    args = parser.parse_args()
    publish(args.site.resolve(), args.checkout.resolve())
