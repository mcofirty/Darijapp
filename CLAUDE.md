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
| Publication | GitHub Pages, via la GitHub Action `.github/workflows/publier.yml` |

## Commandes

```bash
npm run dev                         # serveur local (http://localhost:5173/Darijapp/)
npm test                            # tests Vitest
npm run build                       # build de production dans dist/
python scripts/generate_audio.py    # génère les MP3 manquants (options --theme, --force, --apercu)
```

Publication : chaque push sur `main` lance la GitHub Action « Publier ». Elle génère les MP3 manquants et les commite (`github-actions[bot]`), lance les tests, construit l'appli et la publie sur https://mcofirty.github.io/Darijapp/. Pense à faire `git pull` avant de travailler, l'Action pouvant avoir ajouté des MP3. Le script audio demande `pip install torch transformers uroman` et ffmpeg, et un accès à Hugging Face (bloqué dans l'environnement cloud de Claude Code, ouvert sur GitHub Actions).

## Arborescence cible

```
src/
  app/            navigation à 5 onglets (barre « liquid glass », balayage), layout, en-tête
  audio/          lecture des mots (MP3, sinon synthèse vocale du téléphone)
  features/
    mots/         fiche d'un mot, liste de mots, bouton audio (partagés)
    session/      session du jour : carte d'accueil, étapes, retour, bilan
    apprendre/    accueil (session du jour, guide des sons, thèmes), puis mots difficiles, mode écoute
    parcours/     chemin de leçons, trésors, trophées
    quiz/         quiz de 5 questions, 5 types d'exercices
    progres/      tableau de bord, quêtes, série, statistiques, dictionnaire
    profil/       réglages, export/import, rappel .ics
    onboarding/   premier lancement
  srs/            répétition espacée et dates locales (logique pure)
  exercices/      moteur d'exercices : composition d'une session, leurres, résultats (logique pure)
  scoring/        score de prononciation (logique pure)
  gamification/   XP, niveaux, série (logique pure) ; quêtes au jalon 4
  db/             schéma Dexie et migrations, plan et enregistrement des sessions, résumé en direct
  data/           un fichier JSON par thème, liste des thèmes, sons du darija
scripts/
  generate_audio.py
public/audio/     MP3 générés
docs/
  cahier-des-charges.md
```

## Écrans

| Onglet | Contenu |
| --- | --- |
| Apprendre | Écran d'accueil. Carte « Session du jour » (nouveaux mots, révisions, mots vus, « Commencer » puis « Encore une session », sans limite), puis « Explorer » : guide des sons, 8 thèmes, fiches mots |
| Parcours | Leçons groupées par niveau (niveau 1 « Les bases »), prochaine leçon mise en avant, nœuds Trésor, trophées |
| Quiz | 5 questions mêlant les 5 exercices |
| Progrès | Niveau, XP, quêtes, coffre, série, statistiques (prévu) ; bascule vers le Dictionnaire (fait : tous les mots, ✓ sur les mots déjà vus, recherche latin/français/arabe) |
| Profil | Prénom, avatar, genre, objectif, rappel, audio, affichage arabe, mode sombre, export/import/remise à zéro |

Style « liquid glass » sur toute l'appli (transposition web des principes SwiftUI `glassEffect`) : fond coloré flouté (`.fond`), surfaces en verre (`.verre`, `.verre-teinte` orange, `.verre-vert`, `.verre-rouge` dans `src/index.css`, couche `components`), boutons `.verre-interactif` qui gonflent au toucher avec un reflet sous le doigt, et panneau de session qui s'ouvre et se teinte pour devenir le retour (`.deplier`). Mode sombre géré.

Navigation : barre d'onglets flottante en verre dépoli, icônes SVG ; une lentille marque l'onglet actif et suit le doigt quand on glisse le long de la barre (étirement selon la vitesse, icônes grossies, retour élastique). Un balayage horizontal de la page change aussi d'onglet, sauf sur les zones marquées `data-sans-balayage`.

Fiche mot : latin en grand, arabe dessous (affiché par défaut, masquable dans Profil), traduction, boutons « Écouter » et « Ralenti » (0,75×), lecture automatique à l'ouverture, explication de prononciation, explication de chaque son particulier du mot, exemple avec son audio.

Session du jour (style Duolingo, plein écran) : jusqu'à 8 révisions dues et 5 nouveaux mots dans l'ordre du programme. Chaque nouveau mot est présenté (« Nouveau mot ») puis exercé ; les nouveaux mots puis les révisions finissent par « Associe les paires ». Barre de progression, croix pour quitter, retour immédiat (vert « Bravo ! » ou rouge avec la bonne réponse, petit son, mot rejoué). Une question ratée revient en fin de session. Bilan avec confettis : XP, taux de réussite, série. Sans révision ni mot nouveau : entraînement libre sur 8 mots vus, qui ne change pas la répétition espacée. Pas de cœurs ni de vies.

Exercices : Écoute et choisis, Associe les paires, Dis-le (avec score), Distingue les sons (paires comme 9elb / kelb), Quiz express (60 s).

Fonctions complémentaires : premier lancement guidé, Mes mots, remplacer l'audio d'un mot, signaler un mot, mots difficiles, favoris, mode écoute, rappel en fichier .ics, mode sans micro.

## Règles métier

- **Translittération** : 3 = ع, 7 = ح, 9 = ق, kh = خ, gh = غ, ch = ش. Appliquée partout, sans exception : chaque lettre arabe de cette liste a sa graphie latine dans le mot et l'exemple (vérifié par `data.test.ts`). ق prononcé « g » s'écrit g / ڭ. L'article assimilé se double en latin quand l'arabe l'écrit (ssba7 = الصباح, llil = الليل). Le latin et l'arabe d'un même mot ou exemple disent exactement la même chose.
- **Répétition espacée** (Leitner, boîtes 1 à 4) : un mot raté revient le lendemain (boîte 1) ; un mot réussi revient après 3, 7, puis 21 jours. Un mot compte comme raté s'il a eu au moins une erreur pendant la session.
- **Score de prononciation** : de 0 à 100. 80 et plus : « Excellent », 3 étoiles. De 60 à 79 : « Presque », 2 étoiles. Moins de 60 : « À retravailler », 1 étoile. 60 et plus compte comme réussi. Le bouton « Le score se trompe » permet une correction manuelle.
- **Calibrage du score** : deux rendus de synthèse du même mot doivent dépasser 80 ; deux mots proches doivent rester sous 60.
- **XP** : 1 par bonne réponse, 10 par session terminée, 5 de bonus sans faute.
- **Niveaux** : 120 XP pour le niveau 1, 140 pour le niveau 2, puis 20 XP de plus par niveau. Noms : Terreau, Graine, Germe, Pousse, Tige, Feuilles, Bouton, Fleur, Fruit, puis Arbre.
- **Quêtes** : 3 par jour, renouvelées à minuit heure locale. Les 3 terminées ouvrent le coffre (+60 XP). Un nœud Trésor rapporte +100 XP.
- **Série** : jours avec au moins une session. Aujourd'hui non fait ne casse rien. Une journée manquée est pardonnée si aucune autre ne l'a été dans les 7 jours ; deux jours manqués d'affilée cassent la série.
- **Genre** : sert à accorder les phrases (« toi » = nta au masculin, nti au féminin).

## Formats de données

Mot (`src/data/<theme>.json`) :

```json
{
  "id": "salutations-012",
  "latin": "3afak",
  "arabe": "عافاك",
  "fr": "s'il te plaît",
  "theme": "salutations",
  "niveau": 1,
  "prononciation": "3a-fak : commence par le 3 (ع), un « a » serré au fond de la gorge.",
  "audio": "audio/salutations-012.mp3",
  "exemple": { "latin": "3tini atay 3afak", "arabe": "عطيني أتاي عافاك", "fr": "Donne-moi du thé, s'il te plaît", "audio": "audio/salutations-012-ex.mp3" }
}
```

L'id suit `<theme>-NNN` dans l'ordre du fichier ; `src/data/data.test.ts` vérifie le format, l'unicité et la translittération.

Session terminée (IndexedDB, table `sessions`, depuis la v2) :

```json
{ "id": 1, "date": "2026-10-12", "xp": 27, "bonnes": 12, "mauvaises": 0, "nouveaux": 5 }
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
- Tant que GitHub Pages n'est pas activé (Source « GitHub Actions »), le job `deploy` échoue avec une erreur 404 « Failed to create deployment ».
- L'environnement cloud de Claude Code ne peut pas joindre mcofirty.github.io (proxy) : vérifier la mise en ligne par l'état du job `deploy`, pas par une requête au site.
- Safari et le service worker gardent les icônes en cache par URL : pour changer une icône, changer aussi son nom de fichier (`logo-*.png`), puis supprimer et réinstaller l'appli sur l'écran d'accueil.
- mms-tts-ara attend du texte romanisé (uroman) : romaniser l'arabe perd les voyelles (« alslam 'lykm »). Toujours partir du latin, et vérifier avec `--apercu`. Un 7 après k, s, g ou c reçoit une voyelle (k7la → kahla) pour ne pas devenir kh ou sh.
- Les classes de verre doivent rester dans `@layer components` : hors couche, leur `position: relative` écrase `fixed`/`sticky` de Tailwind (la barre du bas avait disparu).
- Après la génération des MP3, mets à jour la liste des fichiers mis en cache par la PWA pour que l'audio marche hors ligne.

## Façon de travailler

1. En début de session : lis ce fichier, regarde « État du projet », lance les tests.
2. Pour chaque demande : propose un plan court et attends la validation avant de coder.
3. Code, puis écris ou mets à jour les tests.
4. Mets à jour ce fichier (règles ci-dessous), puis fais le commit.

## État du projet

Jalon en cours : **2 — Exercices**, en cours : session du jour livrée ; restent l'onglet Quiz et le Quiz express. Le jalon 1 est en ligne sur https://mcofirty.github.io/Darijapp/.

| Jalon | Durée estimée | Contenu | Statut |
| --- | --- | --- | --- |
| 1. Socle | Semaine 1 | PWA, 5 onglets, script audio, 1 thème de 10 mots (fait : 8 thèmes, 152 mots, 304 MP3) | Terminé |
| 2. Exercices | Semaines 2 et 3 | Cartes, quiz, répétition espacée | En cours |
| 3. Prononciation | Semaines 4 et 5 | Enregistrement, score sur 100, sons du darija | À faire |
| 4. Jeu et contenu | Semaines 6 et 7 | Quêtes, séries, parcours complet, 150 mots | À faire |
| Ensuite | — | Grammaire, dialogues, 500 mots | Plus tard |

## Fonctionnalités livrées

| Date | Fonctionnalité | Fichiers clés |
| --- | --- | --- |
| 2026-10-10 | Socle PWA : 5 onglets, en-tête, base Dexie v1, réglage « afficher l'arabe » | `src/app/`, `src/db/`, `vite.config.ts` |
| 2026-10-10 | 152 mots en 8 thèmes avec arabe, prononciation et exemple ; fiche mot, guide des sons, dictionnaire avec recherche | `src/data/`, `src/features/mots/`, `src/features/apprendre/`, `src/features/progres/` |
| 2026-10-10 | Script de génération audio et lecture avec repli sur la synthèse vocale du téléphone | `scripts/generate_audio.py`, `src/audio/lecteur.ts` |
| 2026-10-12 | Audio régénéré à partir de la translittération latine (avec voyelles) au lieu de l'arabe sans voyelles | `scripts/generate_audio.py`, `public/audio/` |
| 2026-10-12 | Relecture du contenu : 40 mots ou exemples corrigés (ch7al, derhem/drahem, lma, 9ahwa k7la, maticha, articles alignés entre latin et arabe…) et test de cohérence latin/arabe | `src/data/*.json`, `src/data/data.test.ts` |
| 2026-10-12 | Logo de l'appli (bulles « A » et « ش ») en favicon, icône d'écran d'accueil et icônes PWA | `public/logo-*.png` (copies `favicon.png` et `apple-touch-icon.png` pour les anciennes versions en cache) |
| 2026-10-12 | Style liquid glass sur toute l'appli : fond coloré, cartes, en-tête, boutons interactifs, panneau de retour qui se transforme | `src/index.css`, `src/main.tsx`, composants de `src/features/` |
| 2026-10-12 | Session du jour style Duolingo en écran d'accueil : découverte, Écoute et choisis, Traduis, Associe les paires, bilan ; répétition espacée, XP, niveaux, série ; base v2 | `src/features/session/`, `src/exercices/`, `src/srs/`, `src/gamification/`, `src/db/apprentissage.ts` |
| 2026-10-12 | Barre d'onglets flottante « liquid glass » avec glissement du doigt, et balayage de page entre onglets | `src/app/BarreOnglets.tsx`, `src/app/glisser.ts`, `src/app/icones.tsx` |
| 2026-10-11 | GitHub Action qui génère les MP3, teste, construit et publie l'appli sur GitHub Pages | `.github/workflows/publier.yml` |

## Décisions

- 2026-10-11 : appli 100 % locale, publiée sur GitHub Pages. Pas de serveur ni de compte à maintenir.
- 2026-10-11 : audio généré par synthèse vocale (mms-tts-ara), remplaçable mot par mot par une vraie voix. Aucun enregistrement humain n'est nécessaire.
- 2026-10-11 : score par comparaison acoustique MFCC + DTW sur l'appareil. Hors ligne, et la voix reste privée.
- 2026-10-11 : rappel quotidien par fichier .ics. Une notification push exigerait un serveur.

- 2026-10-10 : les 8 thèmes (152 mots) sont écrits dès le jalon 1, à la demande de l'utilisateur, au lieu d'un seul thème de 10 mots.
- 2026-10-10 : l'écriture arabe s'affiche par défaut à côté du latin (demande de l'utilisateur) ; le réglage du Profil permet de la masquer.
- 2026-10-10 : champ `prononciation` obligatoire et `exemple.arabe` ajoutés au format des mots, pour l'explication affichée et pour la synthèse de l'exemple.
- 2026-10-10 : sans MP3, l'appli lit l'écriture arabe avec la synthèse vocale du téléphone (voix arabe) ; la liste des MP3 présents est fixée au build (`__AUDIOS__` dans `vite.config.ts`).
- 2026-10-11 : publication et génération des MP3 par GitHub Actions, pour que tout se fasse sans ordinateur (l'utilisateur n'utilise que son iPhone).
- 2026-10-11 : repo public, pour que GitHub Pages soit gratuit ; aucune donnée personnelle dans le repo, le prénom de l'utilisateur a été retiré des exemples.
- 2026-10-12 : effet « liquid glass » fait en CSS (backdrop-filter, transition élastique) et en Pointer Events, sans bibliothèque d'animation, pour rester léger et fluide sur iPhone ; désactivé avec « Réduire les animations ».
- 2026-10-12 : l'appli garde ses couleurs orange et crème ; la barre reprend le design fourni par l'utilisateur dans ces couleurs.
- 2026-10-12 : nouveaux mots illimités (demande de l'utilisateur) : 5 par session, autant de sessions que voulu ; pas de cœurs ni de blocage.
- 2026-10-12 : la session du jour remplace les « 5 cartes du jour » du cahier des charges ; les exercices Dis-le et Distingue les sons y entreront au jalon 3.
- 2026-10-12 : les réponses ne sont enregistrées qu'en fin de session ; quitter en cours de route ne change rien, pour garder la répétition espacée cohérente.
- 2026-10-12 : la série est calculée à partir de l'historique des sessions (table `sessions`), sans compteur stocké, pour qu'elle ne puisse pas se désynchroniser.
- 2026-10-12 : sons de retour synthétisés par Web Audio, sans fichier à télécharger.
- 2026-10-12 : la synthèse lit le champ `latin` converti en romanisation uroman (3 → ', 7 → h, 9 → q, ch → sh, ou → u), et non l'arabe : mms-tts-ara lit du romanisé, et l'arabe sans voyelles donnait des mots faux (سلام lu « slam »). Tous les MP3 ont été régénérés.
- 2026-10-12 : le code SwiftUI d'Apple (`glassEffect`) ne s'applique qu'aux applis natives ; l'appli reste une PWA et reproduit le liquid glass en CSS. Pas de réfraction (filtres SVG dans `backdrop-filter` non pris en charge par Safari).
- 2026-10-10 : pas de routeur ; navigation par état React, suffisante pour 5 onglets.

## Points en suspens

- Le contenu a été relu et corrigé par Claude (cohérence latin/arabe, tournures), mais pas par un locuteur natif : signaler les erreurs pour corriger les JSON. Quand l'arabe d'un mot change, supprimer son MP3 pour que l'Action le régénère.
- Le Dictionnaire montre tous les mots, avec un ✓ sur ceux déjà vus (le cahier des charges ne prévoyait que les mots vus).
- Onglet Quiz (5 questions) et Quiz express (60 s) : à faire pour finir le jalon 2, en réutilisant `src/exercices/`.

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
