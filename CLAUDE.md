# Darija App

Ce fichier est la mémoire du projet. Lis-le en entier au début de chaque session et mets-le à jour à la fin de chaque tâche, en suivant les règles de la dernière section. Il doit toujours décrire le projet tel qu'il est aujourd'hui.

## Projet

- PWA personnelle pour apprendre le vocabulaire du darija marocain à l'oral, par sessions ludiques de 5 à 10 minutes par jour.
- Utilisateur unique : un francophone débutant qui ne lit pas l'arabe et utilise l'appli sur iPhone.
- Objectif : 300 mots et expressions en 3 mois, prononciation des sons ع (3), ح (7), ق (9), خ (kh), غ (gh).
- Spécifications fonctionnelles complètes : `docs/cahier-des-charges.md`. En cas de doute sur un comportement, c'est la référence.

## Principes non négociables

- 100 % local : aucun serveur, aucun compte, aucun service externe, aucune clé d'API.
- Tout doit être réalisable par du code dans ce repo.
- Rien de payant ni de verrouillé : toutes les leçons, sessions et quiz sont accessibles à tout moment.
- Fonctionne hors ligne après le premier chargement.
- La voix de l'utilisateur et sa progression ne quittent jamais l'appareil.
- Mobile d'abord (iPhone, Safari, PWA installée sur l'écran d'accueil), interface en français.

Ne modifie jamais cette section sans demande explicite.

## Stack

| Brique | Choix |
| --- | --- |
| Interface | React + Vite + TypeScript, Tailwind CSS |
| Hors ligne | PWA via vite-plugin-pwa |
| Stockage | IndexedDB via Dexie |
| Audio des mots | `scripts/generate_audio.py` avec facebook/mms-tts-ara, MP3 dans `public/audio/` |
| Audio des mots ajoutés | API Web Speech (`speechSynthesis`) |
| Enregistrement | MediaRecorder |
| Score de prononciation | MFCC (Meyda) + DTW, dans `src/scoring/` |
| Tests | Vitest |
| Publication | GitHub Pages |

## Commandes

Prévues, à confirmer dès qu'elles existent :

```bash
npm run dev                         # serveur local
npm test                            # tests Vitest
npm run build                       # build de production
npm run deploy                      # publication sur GitHub Pages (script à créer au jalon 1)
python scripts/generate_audio.py    # génère les MP3 manquants à partir de src/data/*.json
```

## Arborescence cible

```
src/
  app/            navigation à 5 onglets, layout, en-tête (niveau, XP, série)
  features/
    apprendre/    cartes du jour, mots difficiles, mode écoute
    parcours/     chemin de leçons, trésors, trophées
    quiz/         quiz de 5 questions, 5 types d'exercices
    progres/      tableau de bord, quêtes, série, statistiques, dictionnaire
    profil/       réglages, export/import, rappel .ics
    onboarding/   premier lancement
  srs/            répétition espacée (logique pure)
  scoring/        score de prononciation (logique pure)
  gamification/   XP, niveaux, quêtes, série (logique pure)
  db/             schéma Dexie et migrations
  data/           un fichier JSON par thème
scripts/
  generate_audio.py
public/audio/     MP3 générés
docs/
  cahier-des-charges.md
```

## Écrans

| Onglet | Contenu |
| --- | --- |
| Apprendre | Session de 5 cartes du jour, dans les deux sens ; toucher pour retourner ; « À réviser » / « Je connais » |
| Parcours | Leçons groupées par niveau (niveau 1 « Les bases »), prochaine leçon mise en avant, nœuds Trésor, trophées |
| Quiz | 5 questions mêlant les 5 exercices |
| Progrès | Niveau, XP, quêtes, coffre, série, statistiques, bascule vers le Dictionnaire |
| Profil | Prénom, avatar, genre, objectif, rappel, audio, affichage arabe, mode sombre, export/import/remise à zéro |

Exercices : Écoute et choisis, Associe les paires, Dis-le (avec score), Distingue les sons (paires comme 9elb / kelb), Quiz express (60 s).

Fonctions complémentaires : premier lancement guidé, Mes mots, remplacer l'audio d'un mot, signaler un mot, mots difficiles, favoris, mode écoute, rappel en fichier .ics, mode sans micro.

## Règles métier

- **Translittération** : 3 = ع, 7 = ح, 9 = ق, kh = خ, gh = غ, ch = ش. Appliquée partout, sans exception.
- **Répétition espacée** (Leitner) : un mot raté revient le lendemain ; un mot réussi revient après 3, 7, puis 21 jours.
- **Score de prononciation** : de 0 à 100. 80 et plus : « Excellent », 3 étoiles. De 60 à 79 : « Presque », 2 étoiles. Moins de 60 : « À retravailler », 1 étoile. 60 et plus compte comme réussi. Le bouton « Le score se trompe » permet une correction manuelle.
- **Calibrage du score** : deux rendus de synthèse du même mot doivent dépasser 80 ; deux mots proches doivent rester sous 60.
- **Niveaux** : 120 XP pour le niveau 1, 140 pour le niveau 2, puis 20 XP de plus par niveau. Les niveaux portent des noms de plante (niveau 2 : « Graine »).
- **Quêtes** : 3 par jour, renouvelées à minuit heure locale. Les 3 terminées ouvrent le coffre (+60 XP). Un nœud Trésor rapporte +100 XP.
- **Série** : une journée manquée par semaine ne casse pas la série.
- **Genre** : sert à accorder les phrases (« toi » = nta au masculin, nti au féminin).

## Formats de données

Mot (`src/data/<theme>.json`) :

```json
{
  "id": "politesse-004",
  "latin": "3afak",
  "arabe": "عافاك",
  "fr": "s'il te plaît",
  "theme": "politesse",
  "niveau": 1,
  "audio": "audio/politesse-004.mp3",
  "exemple": { "latin": "3tini atay 3afak", "fr": "Donne-moi du thé, s'il te plaît", "audio": "audio/politesse-004-ex.mp3" }
}
```

Progression d'un mot (IndexedDB) :

```json
{ "id": "politesse-004", "boite": 3, "prochaineRevision": "2026-10-18", "reussites": 5, "echecs": 1, "scores": [62, 74, 81], "favori": false, "signale": false, "audioPerso": null }
```

## Conventions de code

- TypeScript strict, composants fonctionnels et hooks.
- La logique métier (`srs/`, `scoring/`, `gamification/`) reste pure, sans dépendance à React, et chaque fonction a ses tests.
- Toutes les données persistantes passent par Dexie. Tout changement de schéma passe par une migration, sans perte de progression.
- Les textes de l'interface sont en français.
- Les tests passent avant chaque commit.
- Messages de commit en français : `feat: …`, `fix: …`, `refactor: …`, `docs: …`.

## Pièges connus

- GitHub Pages sert l'appli dans un sous-dossier : il faut régler `base` dans `vite.config.ts` sur le nom du repo.
- Sur iPhone, le micro exige HTTPS et un geste de l'utilisateur. La lecture audio automatique ne démarre qu'après une première interaction.
- Sur Safari, MediaRecorder produit de l'`audio/mp4` : décode l'enregistrement avec `AudioContext.decodeAudioData` avant de calculer les MFCC.
- Après la génération des MP3, mets à jour la liste des fichiers mis en cache par la PWA pour que l'audio marche hors ligne.

## Façon de travailler

1. En début de session : lis ce fichier, regarde « État du projet », lance les tests.
2. Pour chaque demande : propose un plan court et attends la validation avant de coder.
3. Code, puis écris ou mets à jour les tests.
4. Mets à jour ce fichier (règles ci-dessous), puis fais le commit.

## État du projet

Jalon en cours : **1 — Socle**, pas commencé.

| Jalon | Durée estimée | Contenu | Statut |
| --- | --- | --- | --- |
| 1. Socle | Semaine 1 | PWA, 5 onglets, script audio, 1 thème de 10 mots | À faire |
| 2. Exercices | Semaines 2 et 3 | Cartes, quiz, répétition espacée | À faire |
| 3. Prononciation | Semaines 4 et 5 | Enregistrement, score sur 100, sons du darija | À faire |
| 4. Jeu et contenu | Semaines 6 et 7 | Quêtes, séries, parcours complet, 150 mots | À faire |
| Ensuite | — | Grammaire, dialogues, 500 mots | Plus tard |

## Fonctionnalités livrées

| Date | Fonctionnalité | Fichiers clés |
| --- | --- | --- |
| — | Rien pour l'instant | — |

## Décisions

- 2026-10-11 : appli 100 % locale, publiée sur GitHub Pages. Pas de serveur ni de compte à maintenir.
- 2026-10-11 : audio généré par synthèse vocale (mms-tts-ara), remplaçable mot par mot par une vraie voix. Aucun enregistrement humain n'est nécessaire.
- 2026-10-11 : score par comparaison acoustique MFCC + DTW sur l'appareil. Hors ligne, et la voix reste privée.
- 2026-10-11 : rappel quotidien par fichier .ics. Une notification push exigerait un serveur.

## Points en suspens

- Aucun pour l'instant.

## Mise à jour de ce fichier (obligatoire)

À la fin de chaque tâche qui modifie le code ou le contenu, et avant le commit :

1. Ajoute une ligne à « Fonctionnalités livrées » : date, fonctionnalité en une phrase, fichiers clés.
2. Mets à jour « État du projet » : jalon en cours et statut de chaque jalon (À faire, En cours, Terminé).
3. Pour chaque décision technique prise (bibliothèque, format, convention, compromis), ajoute une ligne datée à « Décisions », avec la raison en une phrase.
4. Si la stack, les commandes, l'arborescence, les formats de données, les règles métier ou les écrans changent, corrige la section concernée. Remplace l'ancien contenu au lieu d'ajouter une version de plus.
5. Si tu découvres un piège (bug de plateforme, comportement inattendu), ajoute-le à « Pièges connus ».
6. Note dans « Points en suspens » ce qui reste à faire ou ce qui a été contourné, et retire ce qui est réglé.
7. Si le comportement livré diffère de `docs/cahier-des-charges.md`, mets aussi à jour ce document et signale-le dans ta réponse.
8. Garde ce fichier sous 300 lignes. Quand « Fonctionnalités livrées » dépasse 30 lignes, résume les jalons terminés en une ligne chacun.
9. Inclus CLAUDE.md dans le même commit que le code.
