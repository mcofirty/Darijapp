# Darijaapp

Ce fichier est la mémoire du projet. Lis-le en entier au début de chaque session et mets-le à jour à la fin de chaque tâche, en suivant les règles de la dernière section. Il doit toujours décrire le projet tel qu'il est aujourd'hui.

## Projet

- PWA personnelle pour apprendre le vocabulaire du darija marocain à l'oral, par sessions ludiques de 5 à 10 minutes par jour.
- Utilisateur unique : un francophone débutant qui ne lit pas l'arabe et utilise l'appli sur iPhone.
- Objectif : 300 mots et expressions en 3 mois, prononciation des sons ع (3), ح (7), ق (9), خ (kh), غ (gh).
- Spécifications fonctionnelles complètes : `docs/cahier-des-charges.md`. En cas de doute sur un comportement, c'est la référence. Comportement livré en détail (chaque écran, exercice, calcul) : `docs/ecrans.md` ; historique des fonctionnalités et des décisions : `docs/historique.md`.

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
| Interface | React + Vite + TypeScript, Tailwind CSS, icônes Lucide (style SF Symbols) |
| Hors ligne | PWA via vite-plugin-pwa |
| Stockage | IndexedDB via Dexie |
| Audio des mots | MP3 de la voix marocaine Jamal (`ar-MA-JamalNeural`) par l'API Azure Speech (offre gratuite F0), générés par `scripts/generate_audio.py` dans l'Action, dans `public/audio/<id>.mp3` ; secours : voix arabe de l'iPhone (`speechSynthesis`) tant qu'un MP3 manque, secours local mms-tts-ara (`--moteur mms`). Clés : secrets GitHub `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION`, jamais dans le repo |
| Enregistrement | MediaRecorder |
| Score de prononciation | MFCC + DTW écrits dans `src/scoring/` (sans bibliothèque), rééchantillonnage à 16 kHz maison, réglage sur la voix de l'utilisateur ; score précis (expérimental, `src/scoring/sons/`) : modèle wav2vec2 XLSR-53 de Meta (phonétique de Common Voice, Apache 2.0) en ONNX int8, 355 Mo en 8 morceaux dans `public/modele/` (Action « Modèle »), lu par onnxruntime-web (WebAssembly, un fil), téléchargé depuis Profil et gardé dans Cache Storage (`darija-modele`), avec la voix de Jamal déjà analysée (`references.json`, 0,8 Mo) ; tests avec onnxruntime-node |
| Tests | Vitest |
| Publication | GitHub Pages, via la GitHub Action « Publier » (`.github/workflows/publier.yml`) ; MP3 par l'Action « Audio » (`.github/workflows/audio.yml`) |

## Commandes

```bash
npm run dev                         # serveur local (http://localhost:5173/Darijapp/)
npm test                            # tests Vitest
npm run build                       # build de production dans dist/
python scripts/generate_audio.py    # génère les MP3 manquants avec Azure (clés en variables d'environnement ; options --theme, --force, --apercu, --moteur mms)
```

Publication : chaque push sur `main` lance l'Action « Publier » (tests, build, mise en ligne sur https://mcofirty.github.io/Darijapp/, environ 2 min ; une publication en attente est remplacée par la suivante). Quand `src/data/` ou le script audio changent, l'Action « Audio » génère les MP3 manquants avec la voix Jamal (Azure, environ 20 fichiers par minute) sur la dernière version de `main`, commite ce qui est fait même si elle s'arrête en route (`github-actions[bot]`), la suivante reprenant ; à sa fin, « Publier » se relance seule (`workflow_run`) pour mettre les MP3 en ligne. Pense à faire `git pull` avant de travailler, l'Action pouvant avoir ajouté des MP3. Le script Azure n'a pas de dépendance (secours mms : `torch transformers` et ffmpeg). Azure et Hugging Face sont bloqués dans l'environnement cloud de Claude Code, ouverts sur GitHub Actions : la génération se fait toujours par l'Action. Lancées à la main (onglet Actions) : « Modèle » (`scripts/modele/xlsr.py` : télécharge, exporte en ONNX int8, évalue sur les paires ; case « enregistrer » pour l'écrire dans le repo) et « Voix de test » (`scripts/modele/voix_test.py` : les mots des paires par Mouna, Salma, Hamed et Ismael, dans `scripts/modele/voix-test/`, pour les tests seulement). Références du score précis : `npx tsx scripts/modele/references.ts` (ici, environ 10 min) après un changement de latin ou de MP3 ; `references.test.ts` signale une référence périmée.

## Arborescence cible

```
src/
  app/            navigation à 5 onglets (barre Liquid Glass, balayage), animation d'ouverture, fichiers partagés, stockage persistant
  ui/             composants iOS : Page (grand titre), Section/Ligne/Tuile (listes groupées), Bouton, Segmente, Interrupteur, Alerte, Vide
  audio/          lecture des mots (MP3, sinon synthèse vocale du téléphone), audio hors ligne (`horsLigne.ts`), micro et décodage (`micro.ts`)
  features/
    mots/         fiche d'un mot, liste de mots, bouton audio (partagés)
    session/      session du jour : carte d'accueil, étapes (dont Dis-le), retour, bilan
    apprendre/    accueil (session du jour, guide des sons, thèmes), puis mots difficiles
    ecoute/       mode écoute mains libres (choix, lecteur)
    parcours/     voyage en 10 étapes, trésors, passeport
    quiz/         quiz de 5 questions, 5 types d'exercices
    progres/      tableau de bord, quêtes, série, statistiques, dictionnaire
    profil/       réglages, audio hors ligne, rappel .ics, sauvegarde (et son rappel dans le bilan), mots signalés
    parler/       grammaire orale (fiches et entraînement), dialogues
    jeu/          quêtes du jour et théière, semaine, collection, badges, souk, plante et « Mon jardin »
    onboarding/   premier lancement
    ajout/        page cachée « Mes mots » (lien #ajout) : ajouter, modifier, supprimer ses mots
  srs/            répétition espacée et dates locales (logique pure)
  exercices/      moteur d'exercices : composition d'une session, leurres, résultats, modes sans parler / sans écouter (logique pure)
  scoring/        score de prononciation : MFCC, DTW, barème, réglage sur la voix ; `sons/` : score précis son par son (logique pure)
  gamification/   XP, niveaux, série, quêtes, collection, badges (logique pure)
  sauvegarde/     format du fichier de sauvegarde, rappel .ics (logique pure)
  db/             schéma Dexie et migrations, plan et enregistrement des sessions, mots ajoutés, résumé en direct
  data/           un fichier JSON par thème, liste des thèmes, sons du darija, paires de sons (`sons/paires.json`), grammaire et dialogues (`parler/`)
scripts/
  generate_audio.py, modele/ (export du modèle de sons, voix de test)
public/audio/     MP3 générés par l'Action (voix Jamal) ; public/modele/ : modèle de sons (ONNX int8 en morceaux, `xlsr.json`)
docs/
  cahier-des-charges.md   demande d'origine
  ecrans.md               écrans, exercices et règles en détail, tels que livrés
  historique.md           fonctionnalités livrées et décisions, datées
```

## Écrans

Détail complet (chaque écran, exercice, animation, mesure du design) : `docs/ecrans.md`, à lire avant de toucher un écran.

| Onglet | Contenu |
| --- | --- |
| Apprendre | Accueil : grand titre avec la série, carte « Session du jour » (sans limite), quêtes du jour et théière, « Ma progression » (plante, niveau, souk), « Parler » (Dialogues, Grammaire orale), « Explorer » (mode écoute, favoris, mots difficiles, guide des sons, 31 thèmes, fiches mots) |
| Parcours | Voyage au Maroc en 10 étapes couvrant les 31 thèmes, tampon à 80 % des mots retenus, trésors (+100 XP), leçons d'étape, passeport |
| Quiz | Quiz de 5 questions, Quiz express (60 s, +2 s par bonne réponse), Chasse aux sons, Marchandage au souk, Le taxi : XP et série, sans répétition espacée |
| Progrès | Tableau de bord (niveau, série, quêtes, collection, 66 badges en 10 familles), Dictionnaire, Mon jardin |
| Profil | Apparence, Moi (genre), écriture arabe, Exercices (sans parler / sans écouter), Prononciation (micro, réglage sur la voix, score précis), Audio hors ligne, Rappel .ics, Sauvegarde (données protégées, export daté, import), Mots signalés |

- **Session du jour** (plein écran, style Duolingo, sans cœurs) : jusqu'à 8 révisions dues et 5 nouveaux mots dans l'ordre du programme ; découverte, Écoute et choisis, Traduis, Associe les paires, 2 Dis-le, Distingue les sons, Construis la phrase, Dis-le en darija (une révision connue, puis le premier nouveau mot, de mémoire) ; question ratée refaite en fin ; bilan (XP, dirhams, plante qui grandit, rappel de sauvegarde). Sans rien de dû : entraînement libre sur 8 mots vus.
- **Autres écrans** : fiche mot (écoute, ralenti, sons, exemple, favori, signalement), « Mes mots » (page cachée `#ajout`, partage d'un mot par lien `#mot=`), aide à l'installation (Safari sur iPhone), vidéo d'ouverture, grammaire orale (6 fiches), dialogues (8 scènes accordées au genre), mode écoute (mains libres, phrases d'exemple à répéter), Mon jardin et souk.
- **Design** : Human Interface Guidelines d'iOS 26 ; couleurs du drapeau (rouge #C1272D pour l'accent, vert #006233 pour les réussites ; `--accent-plein` / `--vert-plein` sous un texte blanc), clair et sombre (`data-theme`), SF Pro à l'échelle iOS (`.t-grand-titre`…), grands titres et bord flou au défilement, listes groupées façon Réglages (marge 20 pt, cellules 56 pt), angles d'iOS 26 (jetons `--radius-*`, conteneurs concentriques), Liquid Glass (`.verre`, `.verre-fin`, `.verre-epais`) réservé aux commandes, jamais au contenu ; barre d'onglets flottante dont la lentille suit le doigt, balayage entre onglets ; Réduire les animations et Réduire la transparence respectés.

## Règles métier

Calculs détaillés (score, calibrages, paliers, souk, jardin) : `docs/ecrans.md`.

- **Translittération** : 3 = ع, 7 = ح, 9 = ق, kh = خ, gh = غ, ch = ش ; 2 = ء (hamza, mots importés, non vérifié) ; accents permis dans les mots empruntés au français (supermarché, reçu). Appliquée partout, sans exception : chaque lettre arabe de cette liste a sa graphie latine dans le mot et l'exemple (vérifié par `data.test.ts`). ق prononcé « g » s'écrit g / ڭ. L'article assimilé se double en latin quand l'arabe l'écrit (ssba7 = الصباح, llil = الليل). Le latin et l'arabe d'un même mot ou exemple disent exactement la même chose.
- **Répétition espacée** (Leitner, boîtes 1 à 4) : un mot raté revient le lendemain (boîte 1) ; un mot réussi revient après 3, 7, puis 21 jours. Un mot compte comme raté s'il a eu au moins une erreur pendant la session.
- **Score de prononciation** : de 0 à 100 ; 80 et plus « Excellent », de 60 à 79 « Presque », moins de 60 « À retravailler » ; 60 et plus compte comme réussi (répétition espacée, 20 derniers scores dans `progression.scores`) ; « Le score se trompe » inverse le résultat. Score acoustique MFCC + DTW contre Jamal (`src/scoring/score.ts`, `BAREME`, réglage sur la voix) ; score précis son par son (`src/scoring/sons/prononciation.ts`), sinon l'acoustique reprend ; calibrages vérifiés par `calibrage*.test.ts`.
- **XP** : 1 par bonne réponse, 10 par session terminée, 5 de bonus sans faute. **Niveaux** : 30, les paliers de la plante (10 stades de 3 paliers, `NOMS_PALIERS`), 60 XP pour le premier puis 10 de plus par niveau (6 150 XP en tout).
- **Quêtes** : 3 par jour, renouvelées à minuit heure locale (toujours « Termine une session du jour », plus deux tirées selon la date parmi 8) ; les 3 faites ouvrent la théière (+60 XP, une fois par jour). Trésor du Parcours : +100 XP, une fois (table `bonus`).
- **Dirhams** : 1 DH par bonne réponse, bonus de précision (10 sans faute, 5 avec une erreur, 2 avec deux), 60 par théière, 50 par trésor, moins les achats, tout recalculé depuis l'historique. Le souk ne vend que du décor (80 à 400 DH), l'article de départ de chaque rayon est gratuit.
- **Collection et badges** : mot vu en bronze, argent en boîte 3, or en boîte 4 ; 66 badges (`BADGES`) calculés depuis les tables, rien de stocké.
- **Série** : jours avec au moins une session. Aujourd'hui non fait ne casse rien. Une journée manquée est pardonnée si aucune autre ne l'a été dans les 7 jours ; deux jours manqués d'affilée cassent la série.
- **Genre** : sert à accorder les phrases (« toi » = nta au masculin, nti au féminin).
- **Modes** (`exercices/modes.ts`, `adapterEtapes`) : sans parler, Dis-le et Dis-le en darija sont retirés ; sans écouter, Écoute et choisis devient Traduis, Distingue les sons est retiré, les jeux à l'oreille sont grisés, aucun son automatique. « Je ne peux pas parler / écouter maintenant » coupe le mode 15 min.
- **Sauvegarde** : rappel dans le bilan quand le dernier export a 7 jours ou plus (jamais : dès 3 activités).

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

Phrases du marchand (`src/data/jeux/marchandage.json`) : `articles` (`id`, `nom`, `latin`, `arabe`, `prix` : 3 phrases `{ id: jeu-<article>-N, montant, latin, arabe, fr, audio }`), MP3 générés par l'Action. Paires de sons (`src/data/sons/paires.json`, hors des thèmes) : `mots` (`id` = `son-<latin>`, `latin`, `arabe`, `fr`, `audio` = `audio/<id>.mp3`, générés par l'Action) et `paires` (`a`, `b`, `sons` : le son de chacun, « rien » quand le second mot n'a pas de son à la place). Leçons de grammaire (`src/data/parler/grammaire.json`) : `lecons` (`id`, `titre`, `sousTitre`, `regle` : liste de phrases, `formes` : `{ id: gram-<leçon>-N, latin, arabe, fr, audio }`), MP3 générés par l'Action. Dialogues (`src/data/parler/dialogues.json`) : `scenes` (`id`, `titre`, `contexte`, `autre` : le personnage, `repliques` : `{ id: dia-<scène>-N, qui: moi | autre, latin, arabe, fr, audio, feminin?: { id: dia-<scène>-N-f, latin, arabe, fr, audio } }`).

L'id suit `<theme>-NNN` dans l'ordre du fichier ; `src/data/data.test.ts` vérifie le format, l'unicité (latin + arabe) et la translittération. `audio` = `audio/<id>.mp3` (et `audio/<id>-ex.mp3` pour l'exemple, s'il y en a un) : l'Action génère le MP3 s'il manque. Tant qu'il manque, ou si `audio` est vide, la voix de l'iPhone lit l'arabe.

Mot importé (1 530 entrées, thèmes 9 à 31 et fin des 8 premiers) : même format, avec parfois `"note": "Emprunt courant au français"` ; explication et exemple écrits par Claude (2026-10-13). Une même graphie latine peut désigner deux mots différents en arabe (7it = حيت « parce que » ou حيط « mur »). `data.test.ts` exige pour chaque mot une explication et un exemple complets.

Activité terminée (IndexedDB, table `sessions`, depuis la v2 ; `type` = `session`, `quiz`, `express`, `sons`, `marchandage`, `taxi`, `grammaire` ou `dialogue`, absent sur les sessions d'avant le Quiz) :

```json
{ "id": 1, "date": "2026-10-12", "xp": 27, "bonnes": 12, "mauvaises": 0, "nouveaux": 5, "type": "session" }
```

Mot ajouté (IndexedDB, table `motsPerso`, depuis la v3 ; `ajouteLe`, heure de l'ajout chez l'autre personne pour un mot reçu par lien, sans index ni migration ; les liens à trois valeurs, et ceux à cinq de la courte version avec un lieu, restent lus) :

```json
{ "id": "perso-<uuid>", "latin": "khobz", "arabe": "خبز", "fr": "pain", "creeLe": 1760300000000, "ajouteLe": 1760299000000 }
```

Favori ou signalement (IndexedDB, table `marques`, depuis la v4 ; supprimé quand il n'y a plus ni l'un ni l'autre) :

```json
{ "id": "salutations-012", "favori": true, "signale": "traduction", "date": 1760300000000 }
```

Achat du souk (table `achats`, v6) : `{ "id": "chefchaouen", "date": "2026-10-13", "prix": 150 }` ; décor choisi dans le profil (`couleur`, `zellige`, `pot`), couleur copiée dans localStorage (`darija-couleur`) pour l'appliquer avant le premier affichage (`data-couleur` sur `<html>`). Journal du jour (table `journal`, v5) : `{ "date": "2026-10-13", "ecoutes": 12, "coffre": true }` ; XP bonus (table `bonus`, v5) : `{ "id": 1, "date": "2026-10-13", "xp": 60, "raison": "coffre" }`, ajoutés à l'XP total. Sauvegarde (`darijaapp-AAAA-MM-JJ.json`) : `{ "format": "darijaapp-sauvegarde", "version": 1, "date": "…", "tables": { progression, profil, motsPerso, sessions, marques, journal, bonus } }` (`audioPerso` mis à null).

Profil : en plus des réglages, `micro` (Dis-le avec score), `parler` et `ecouter` (modes, vrais par défaut), `pauseParler` et `pauseEcouter` (fin de la pause de 15 min, ou null), `reglageVoix` (12 dernières distances de mots bien dits) et le décor du souk (`couleur`, `zellige`, `pot`, `espece`, `fond`, `objets` : liste des objets affichés, `sons`, `confettis`) et `jardinXpVu` (XP à la dernière visite de « Mon jardin », point de départ de l'animation, null avant la première), `genre` (`m`, `f` ou null = masculin), `scorePrecis` (score par sons, si le modèle est téléchargé), `derniereSauvegarde` (horodatage du dernier export, null si jamais) et `dialogues` (meilleur nombre de répliques réussies par scène). Progression d'un mot (IndexedDB ; ses champs `favori` et `signale` ne servent pas) :

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
- Sur Safari, MediaRecorder produit de l'`audio/mp4` : décode l'enregistrement avec `AudioContext.decodeAudioData` avant de calculer les MFCC. Ne rééchantillonne pas avec un `OfflineAudioContext` : Chrome replie les aigus (+5 dB au-dessus de 5 kHz, même MP3 à 0,9 de distance de lui-même) ; `reechantillonner` (sinus cardinal fenêtré) sert à l'appli et aux tests.
- Micro de l'iPhone : tant qu'il est ouvert, iOS baisse le son de lecture ; `enregistrer()` rend le micro à chaque fin d'enregistrement. Traitements du navigateur (annulation d'écho, réduction de bruit, gain automatique) coupés : ils déforment le spectre. Le runner GitHub n'a pas ffmpeg : « Publier » l'installe pour `calibrage.test.ts` (et `calibrageSons.test.ts`, dont onnxruntime donne des scores un peu différents selon le processeur : seuils à garder avec de la marge), qui décode dans `beforeAll` (le corps d'un `describe.skipIf` sauté s'exécute quand même). Pour tester Dis-le dans Chromium : `--use-fake-device-for-media-stream --use-file-for-fake-audio-capture=essai.wav` (un WAV qui boucle, avec du silence autour du mot).
- L'environnement cloud de Claude Code ne peut pas joindre mcofirty.github.io (proxy) : vérifier la mise en ligne par l'état du job `deploy`, pas par une requête au site.
- Safari et le service worker gardent les icônes en cache par URL : pour changer une icône, changer aussi son nom de fichier (`pot-*.png` depuis le 2026-10-13, avant `logo-*.png`), puis supprimer et réinstaller l'appli sur l'écran d'accueil.
- mms-tts-ara lit l'arabe sans voyelles (lettres arabes seules) : impossible de lui indiquer les voyelles du darija. Le journal de l'Action « Publier » affiche les textes lus : le vérifier avant de conclure.
- La voix lit le champ `arabe` : c'est lui qui fixe la prononciation entendue. Quand l'arabe d'un mot change, supprimer ses MP3 pour qu'ils soient régénérés.
- Un `backdrop-filter` (ou `filter`, `opacity`, `mask`) sur un élément en fait une racine d'arrière-plan : ses enfants ne voient plus la page derrière. Les couches de verre sont donc sur `::before`/`::after`, jamais sur l'élément `.verre` lui-même.
- Les classes de `src/index.css` vivent dans `@layer components` : hors couche, elles écraseraient les utilitaires Tailwind (une `position: relative` avait fait disparaître la barre du bas).
- Les couleurs de texte éclaircies du mode sombre (#ff6961, #2fd27f) ne supportent pas de texte blanc : tout bouton plein utilise `--accent-plein` ou `--vert-plein` (couleurs du drapeau, 5,8:1 et 7,5:1).
- `overflow-x: hidden` sur un conteneur en fait une zone de défilement : `position: sticky` à l'intérieur ne colle plus à la fenêtre. Utiliser `overflow-x: clip` (racine de `App.tsx`).
- `opacity` sur un élément `.verre` (ex. `.pressable:active`) en fait une racine d'arrière-plan : le verre devient opaque pendant l'appui. Les commandes en verre grossissent au toucher, sans opacité.
- Le Chromium de Playwright ne lit pas le H.264 (erreur 4 sur `lancement.mp4`) : pour tester la vidéo d'ouverture, servir une copie en VP9 (`ffmpeg -c:v libvpx-vp9`), sans la commiter.
- Un commit poussé par l'Action (`GITHUB_TOKEN`, `github-actions[bot]`) ne déclenche aucun workflow `push` : « Publier » est relancée par `workflow_run` à la fin d'« Audio ». Les deux Actions font un checkout de `main` et non du commit déclencheur, qui n'a pas les MP3 ajoutés entre-temps par le bot.
- Safari n'envoie pas toujours l'événement de fin de `speechSynthesis` : `parler()` (`src/audio/lecteur.ts`) a un délai de secours selon la longueur du texte, sans quoi le mode écoute resterait bloqué.
- Après la génération des MP3, mets à jour la liste des fichiers mis en cache par la PWA pour que l'audio marche hors ligne. GitHub refuse les fichiers de plus de 100 Mo : le modèle est coupé en morceaux de 45 Mo, recollés dans le navigateur. onnxruntime-node n'embarque pas ses types (`src/types/onnxruntime-node.d.ts`). Le WebAssembly d'onnxruntime-web est importé par `?url` depuis `node_modules`, gardé dans Cache Storage et donné en `blob:` (`wasmPaths`) ; un seul fil, GitHub Pages n'ayant pas l'isolation (COOP/COEP) qu'exigent les fils. Le petit modèle Allosaurus (45 Mo, essayé le 2026-10-13) n'a ni ʕ ni ħ et confondait q, kh et gh : retiré.

## Façon de travailler

1. En début de session : lis ce fichier, regarde « État du projet », lance les tests.
2. Pour chaque demande : propose un plan court et attends la validation avant de coder.
3. Code, puis écris ou mets à jour les tests.
4. Mets à jour ce fichier (règles ci-dessous), puis fais le commit.

## État du projet

Jalon en cours : **4 — Jeu** (contenu du jeu terminé). Les jalons 1 à 3 sont en ligne sur https://mcofirty.github.io/Darijapp/ (score de prononciation à éprouver sur iPhone avec une vraie voix).

| Jalon | Durée estimée | Contenu | Statut |
| --- | --- | --- | --- |
| 1. Socle | Semaine 1 | PWA, 5 onglets, script audio, 1 thème de 10 mots (fait : 8 thèmes, 152 mots, 304 MP3) | Terminé |
| 2. Exercices | Semaines 2 et 3 | Cartes, quiz, répétition espacée | Terminé |
| 3. Prononciation | Semaines 4 et 5 | Enregistrement, score sur 100, sons du darija | Terminé |
| 4. Jeu et contenu | Semaines 6 et 7 | Quêtes, séries, parcours complet, 150 mots (fait : 1 682 mots en 31 thèmes, quêtes, théière, collection, badges) | En cours |
| Ensuite | — | Grammaire, dialogues, 500 mots (fait : grammaire orale en 6 fiches, 8 dialogues, phrases à construire, Dis-le en darija, modes sans parler / sans écouter) | En cours |

## Fonctionnalités livrées

Liste complète, ligne par ligne : `docs/historique.md`.

| Date | Domaine | Fichiers clés |
| --- | --- | --- |
| 2026-10-10 à 12 | Jalon 1, socle : PWA à 5 onglets, base Dexie, thèmes et fiche mot, voix Jamal générée par l'Action, design d'iOS 26, « Mes mots » (`#ajout`), aide à l'installation, vidéo d'ouverture, import de 1 530 mots | `src/app/`, `src/db/`, `src/data/`, `src/ui/`, `src/features/ajout/`, `scripts/generate_audio.py` |
| 2026-10-12 et 13 | Jalon 2, exercices : session du jour, répétition espacée, Quiz (quiz, express, Chasse aux sons), Distingue les sons, mode écoute, favoris, mots difficiles, signalements | `src/features/session/`, `src/exercices/`, `src/srs/`, `src/features/quiz/`, `src/features/ecoute/` |
| 2026-10-13 | Jalon 3, prononciation : Dis-le (MFCC + DTW), réglage sur la voix, anneau du score, score précis (modèle de sons) | `src/scoring/`, `src/audio/micro.ts`, `src/audio/modeleSons.ts`, `src/features/session/DisLe.tsx` |
| 2026-10-13 | Jalon 4, jeu : quêtes et théière, collection, 66 badges, Parcours, dirhams et souk, plante en 30 paliers et « Mon jardin », marchandage et taxi, rappel .ics, sauvegarde | `src/gamification/`, `src/features/jeu/`, `src/features/parcours/`, `src/sauvegarde/` |
| 2026-10-13 | Parler : Construis la phrase, Dis-le en darija, grammaire orale, dialogues ; modes sans parler et sans écouter | `src/features/parler/`, `src/exercices/phrases.ts`, `src/exercices/modes.ts` |
| 2026-10-13 | Sauvegarde protégée et rappelée, audio hors ligne, oral d'abord (nouveau mot redit de mémoire, phrases du mode écoute), `CLAUDE.md` résumé | `src/app/stockage.ts`, `src/audio/horsLigne.ts`, `src/exercices/ecoute.ts`, `docs/` |

## Décisions

Les principales, qui encadrent le travail à venir ; toutes, datées et avec leur raison : `docs/historique.md`.

- Appli 100 % locale sur GitHub Pages, repo public (aucune donnée personnelle hors demandes de l'utilisateur) ; MP3 et publication par GitHub Actions, l'utilisateur n'ayant que son iPhone.
- Voix Jamal par l'API Azure (écart assumé à « aucune clé d'API » : la clé ne sert que dans l'Action) ; elle lit l'arabe sans voyelles, gardée telle quelle au choix de l'utilisateur ; un mot qui sonne mal se corrige par son champ `arabe`, puis son MP3 est supprimé.
- Pas de routeur : navigation par état React, hash pour `#ajout` et `#mot=`. Listes longues affichées par tranches.
- Rien de ce qui se calcule n'est stocké (série, quêtes, badges, dirhams, niveau, collection) : seuls `journal`, `bonus` et `achats` s'ajoutent à la progression. Champs du profil ajoutés sans index ni migration ; localStorage seulement pour appliquer un réglage avant le premier affichage.
- Réponses enregistrées en fin de session, quitter ne change rien ; Quiz, jeux et mots des paires de sons hors répétition espacée.
- Score écrit à la main (MFCC + DTW, sans bibliothèque), une seule référence (Jamal), voix compensée par étirements de fréquence et réglage ; score précis optionnel (modèle XLSR téléchargé à la demande, noté par comparaison avec Jamal). La voix n'est jamais gardée.
- Design d'Apple en CSS (Liquid Glass sans bibliothèque, Lucide, `Alerte` à la place de `window.confirm`).
- MP3 hors du précache : gardés à la première écoute ou tous téléchargés depuis Profil. Sauvegarde « automatique » impossible sans geste sur iPhone : rappel tous les 7 jours et stockage persistant.
- Souk limité au décor (rien de payant ni de verrouillé) ; plante et décors en SVG dans le code.
- Grammaire et dialogues réutilisent le moteur de session ; les modes s'appliquent en un seul point (`adapterEtapes`).
- 2026-10-13 : `CLAUDE.md` résumé (détail dans `docs/ecrans.md` et `docs/historique.md`), pour rester lisible en début de session.

## Points en suspens

- Voix : MP3 Jamal générés par l'Action « Audio » (secrets `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION`) ; si Azure refuse (401/403), vérifier la clé, la région et le niveau F0. Tant qu'un MP3 manque, la voix de l'iPhone lit (arabe standard). La voix reste un peu « littéraire » (arabe standard) : pour un mot qui sonne mal, corriger son champ `arabe` (orthographe darija) et supprimer son MP3.
- Score précis : jamais essayé sur iPhone ni avec une vraie voix. Le modèle occupe environ 700 Mo de mémoire à l'ouverture (morceaux recollés puis copiés dans WebAssembly) : Safari pourrait fermer l'onglet ; le modèle s'ouvre 3 s après le lancement de l'appli (score précis actif) ; mesuré dans Chromium, 4 s du toucher au score, dont 3,2 s d'enregistrement (16 s avant les références pré-calculées et le rognage) ; onnxruntime-web met environ 1,1 s de calcul par seconde d'audio sur un cœur (2,4 fois moins avec 4 fils, impossibles sans COOP/COEP). Le modèle entend mal le ع et le ح même chez Jamal : il les juge par comparaison, pas seul. À faire : noter des essais réels ; si l'iPhone ne tient pas, essayer les fils (en-têtes COOP/COEP par le service worker) ou un modèle plus petit. Score acoustique : calibré sur des rendus de la voix Jamal et vérifié dans Chromium avec un faux micro (même mot plus aigu : 85 ; autre mot : 13), jamais avec une vraie voix humaine ni sur iPhone. À éprouver : faire le réglage dans Profil, puis noter les scores de mots bien et mal dits ; ajuster `BAREME` et `DISTANCE_DE_REGLAGE` (`src/scoring/score.ts`) si besoin. Envisagé : seconde référence avec la voix Mouna (`ar-MA-MounaNeural`), meilleure des deux notes ; quête « 3 mots notés 80 ou plus ». Pas de score pour les mots ajoutés (pas de MP3) : auto-évaluation. Le score des phrases (grammaire, dialogues) est calibré sur des rendus de Jamal, pas encore sur une vraie voix : à éprouver aussi.
- Contenu relu par Claude (cohérence latin/arabe), jamais par un locuteur natif : l'arabe, les explications et les exemples des 1 530 mots importés sont de Claude ; signaler les erreurs depuis la fiche mot. Les 1 530 MP3 d'exemple sont générés par l'Action « Audio » (environ 1h20). Les 50 phrases de grammaire et les 8 dialogues sont aussi de Claude, sans relecture native (leurs 106 MP3 sont générés).
- Mode écoute : vérifier sur iPhone que la lecture continue écran allumé, et si les commandes de l'écran verrouillé apparaissent. Le Dictionnaire montre tous les mots, avec une pastille bronze, argent ou or sur ceux déjà vus (le cahier des charges ne prévoyait que les mots vus).
- Vérifier sur iPhone que « Données protégées » passe à Oui dans l'appli installée, et que « Tout télécharger » (audio hors ligne) fait jouer les mots en mode Avion (vérifié dans Chromium : 3 511 fichiers en 16 s en local, lus hors ligne, requêtes Range comprises). Safari demande les MP3 par morceaux (réponse 206, que le cache n'accepte pas) : le « gardé à la première écoute » ne marche peut-être pas sur iPhone, d'où l'intérêt du téléchargement complet.
- Sur iPhone, l'appli installée et Safari ont chacun leur mémoire (non vérifié) : un lien `#mot=…` ouvert dans Safari ajoute sans doute le mot à Safari ; contournement : Profil > Exporter dans Safari, puis Importer dans l'appli.

## Mise à jour de ce fichier (obligatoire)

À la fin de chaque tâche qui modifie le code ou le contenu, et avant le commit :

1. Ajoute une ligne à « Fonctionnalités livrées » de `docs/historique.md` (date, fonctionnalité en une phrase, fichiers clés) et complète ici la ligne du domaine concerné.
2. Mets à jour « État du projet » : jalon en cours et statut de chaque jalon (À faire, En cours, Terminé).
3. Pour chaque décision technique prise (bibliothèque, format, convention, compromis), ajoute une ligne datée à « Décisions » de `docs/historique.md`, avec la raison en une phrase ; ici, seulement si elle encadre le travail à venir.
4. Si la stack, les commandes, l'arborescence, les formats de données, les règles métier ou les écrans changent, corrige la section concernée ici et le détail dans `docs/ecrans.md`. Remplace l'ancien contenu au lieu d'ajouter une version de plus.
5. Si tu découvres un piège (bug de plateforme, comportement inattendu), ajoute-le à « Pièges connus ».
6. Note dans « Points en suspens » ce qui reste à faire ou ce qui a été contourné, et retire ce qui est réglé.
7. Si le comportement livré diffère de `docs/cahier-des-charges.md`, mets aussi à jour ce document et signale-le dans ta réponse.
8. Garde ce fichier sous 300 lignes et sous 45 000 caractères : le détail va dans `docs/ecrans.md`, l'historique dans `docs/historique.md`.
9. Inclus CLAUDE.md et les documents touchés dans le même commit que le code.
