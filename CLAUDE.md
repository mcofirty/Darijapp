# Darijaapp

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
| Interface | React + Vite + TypeScript, Tailwind CSS, icônes Lucide (style SF Symbols) |
| Hors ligne | PWA via vite-plugin-pwa |
| Stockage | IndexedDB via Dexie |
| Audio des mots | MP3 de la voix marocaine Jamal (`ar-MA-JamalNeural`) par l'API Azure Speech (offre gratuite F0), générés par `scripts/generate_audio.py` dans l'Action, dans `public/audio/<id>.mp3` ; secours : voix arabe de l'iPhone (`speechSynthesis`) tant qu'un MP3 manque, secours local mms-tts-ara (`--moteur mms`). Clés : secrets GitHub `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION`, jamais dans le repo |
| Enregistrement | MediaRecorder |
| Score de prononciation | MFCC (Meyda) + DTW, dans `src/scoring/` |
| Tests | Vitest |
| Publication | GitHub Pages, via la GitHub Action « Publier » (`.github/workflows/publier.yml`) ; MP3 par l'Action « Audio » (`.github/workflows/audio.yml`) |

## Commandes

```bash
npm run dev                         # serveur local (http://localhost:5173/Darijapp/)
npm test                            # tests Vitest
npm run build                       # build de production dans dist/
python scripts/generate_audio.py    # génère les MP3 manquants avec Azure (clés en variables d'environnement ; options --theme, --force, --apercu, --moteur mms)
```

Publication : chaque push sur `main` lance l'Action « Publier » (tests, build, mise en ligne sur https://mcofirty.github.io/Darijapp/, environ 2 min ; une publication en attente est remplacée par la suivante). Quand `src/data/` ou le script audio changent, l'Action « Audio » génère les MP3 manquants avec la voix Jamal (Azure, environ 20 fichiers par minute) sur la dernière version de `main`, commite ce qui est fait même si elle s'arrête en route (`github-actions[bot]`), la suivante reprenant ; à sa fin, « Publier » se relance seule (`workflow_run`) pour mettre les MP3 en ligne. Pense à faire `git pull` avant de travailler, l'Action pouvant avoir ajouté des MP3. Le script Azure n'a pas de dépendance (secours mms : `torch transformers` et ffmpeg). Azure et Hugging Face sont bloqués dans l'environnement cloud de Claude Code, ouverts sur GitHub Actions : la génération se fait toujours par l'Action.

## Arborescence cible

```
src/
  app/            navigation à 5 onglets (barre Liquid Glass, balayage), animation d'ouverture
  ui/             composants iOS : Page (grand titre), Section/Ligne/Tuile (listes groupées), Bouton, Segmente, Interrupteur, Alerte, Vide
  audio/          lecture des mots (MP3, sinon synthèse vocale du téléphone)
  features/
    mots/         fiche d'un mot, liste de mots, bouton audio (partagés)
    session/      session du jour : carte d'accueil, étapes, retour, bilan
    apprendre/    accueil (session du jour, guide des sons, thèmes), puis mots difficiles
    ecoute/       mode écoute mains libres (choix, lecteur)
    parcours/     chemin de leçons, trésors, trophées
    quiz/         quiz de 5 questions, 5 types d'exercices
    progres/      tableau de bord, quêtes, série, statistiques, dictionnaire
    profil/       réglages, export/import, rappel .ics
    onboarding/   premier lancement
    ajout/        page cachée « Mes mots » (lien #ajout) : ajouter, modifier, supprimer ses mots
  srs/            répétition espacée et dates locales (logique pure)
  exercices/      moteur d'exercices : composition d'une session, leurres, résultats (logique pure)
  scoring/        score de prononciation (logique pure)
  gamification/   XP, niveaux, série (logique pure) ; quêtes au jalon 4
  db/             schéma Dexie et migrations, plan et enregistrement des sessions, mots ajoutés, résumé en direct
  data/           un fichier JSON par thème, liste des thèmes, sons du darija, paires de sons (`sons/paires.json`)
scripts/
  generate_audio.py
public/audio/     MP3 générés par l'Action (voix Jamal)
docs/
  cahier-des-charges.md
```

## Écrans

| Onglet | Contenu |
| --- | --- |
| Apprendre | Écran d'accueil. Grand titre avec la série (flamme). Carte « Session du jour » (nouveaux mots, révisions, mots vus, « Commencer » puis « Encore une session », sans limite), section « Ma progression » (niveau, XP), puis « Explorer » : mode écoute, mes favoris, mots difficiles (ratés et en boîte 1 ou 2 ; listes avec « Réviser » = entraînement libre sur 8 mots, et « Écouter »), guide des sons et 31 thèmes en liste groupée, fiches mots |
| Parcours | Leçons groupées par niveau (niveau 1 « Les bases »), prochaine leçon mise en avant, nœuds Trésor, trophées |
| Quiz | Trois cartes. « Contrôle tes acquis » : quiz de 5 questions (Écoute et choisis, Traduis, une Distingue les sons et une Associe les paires, jamais en premier) sur les mots les moins sus (boîte, échecs, retard), complétés par le début du programme ; aucune question refaite ; bilan « x sur 5 », « Sans faute ! ». « Quiz express » : 60 s, questions enchaînées sans « Continuer » (réponse affichée 0,45 s), chrono qui rougit à 10 s, score, record gardé dans le profil. « Chasse aux sons » : même chrono avec des questions Distingue les sons, combo (dès la 5e bonne réponse d'affilée, chacune vaut 2 points), record en points. Quiz, Quiz express et Chasse aux sons donnent de l'XP et comptent pour la série, sans toucher à la répétition espacée |
| Progrès | Contrôle segmenté Tableau de bord / Dictionnaire. Tableau : niveau et XP restants, XP total, XP du jour, série, sessions du jour, mots vus (quêtes, coffre et statistiques au jalon 4). Dictionnaire : recherche iOS, tous les mots avec ✓ sur ceux déjà vus |
| Profil | Fait : Apparence (Automatique / Clair / Sombre), écriture arabe, « Mots signalés » (liste à envoyer par la feuille de partage ou à copier, pour les corriger avec Claude). Prévu : prénom, avatar, genre, objectif, rappel, audio, export/import/remise à zéro |

Design : règles d'Apple (Human Interface Guidelines, iOS 26). Couleurs sémantiques système en clair et en sombre (`src/index.css` : fond groupé, cartes, libellés primaire/secondaire, séparateurs), couleurs principales du drapeau marocain : rouge #C1272D pour l'accent et les boutons, vert #006233 pour les réussites (`--accent`/`--vert` pour le texte, éclaircis en sombre ; `--accent-plein`/`--vert-plein` pour les fonds de boutons ; contrastes WCAG AA). Apparence clair/sombre réglable dans Profil (Automatique, Clair, Sombre) : attribut `data-theme` sur `<html>`, variante `dark:` de Tailwind redéfinie en conséquence. Typographie système SF Pro avec l'échelle iOS (classes `.t-grand-titre` à `.t-legende`, en rem sur le corps 17 pt, Dynamic Type via `-apple-system-body`). Chaque écran a un grand titre ; au défilement, le titre passe en petit au centre et le contenu s'efface sous un bord flou (`.bord-flou`, effet de bord d'iOS 26) ; le retour est un chevron seul dans un bouton rond en verre. Contenu en listes groupées façon Réglages, mesurées sur une capture de l'utilisateur (écran de 440 pt) : marge des pages 20 pt (`px-marge`), cellules de 56 pt minimum (`min-h-ligne`), texte à 20 pt du bord de la carte, séparateurs alignés sur le texte et arrêtés à 20 pt du bord droit, titres de section en 17 pt semi-gras gris sans majuscules, tuiles d'icônes colorées, chevrons. Angles d'iOS 26 (jetons `--radius-*` de `src/index.css`, classes `rounded-liste`…) : listes et cartes 26 px, tuiles d'icônes 8 px, réponses des exercices en capsule, logo à 22,37 % ; un conteneur qui entoure un bouton en capsule est concentrique (rayon du bouton + marge : panneaux en verre, carte Session du jour, alertes, aide à l'installation, carte « Thème » du Profil avec son contrôle segmenté, via la prop `arrondi` de `Section`) ; angles continus (`corner-shape: superellipse`) là où le navigateur les dessine, capsules exclues. Liquid Glass (`.verre` : verre clair au centre, bande de bord plus réfractante, liseré lumineux, légère dispersion colorée ; `.verre-fin` pour les petites commandes ; `.verre-epais` pour les alertes et la recherche, plus opaque pour rester lisible ; `.lentille-goutte` pour les curseurs pendant le geste) réservé aux commandes : barre d'onglets, boutons de barre (retour, série), croix et capsule de progression de la session, panneaux « Continuer » et du bilan, champ de recherche collant du Dictionnaire, alertes (composant `Alerte`, à la place de `window.confirm`) ; jamais sur le contenu. Contrôle segmenté façon iOS 26 : capsule grise, curseur en verre clair au repos (`.verre-curseur`) ; pendant l'appui ou le glissement, il devient une goutte de verre qui suit le doigt, puis revient avec un rebond. Interrupteur : la pastille devient une goutte de verre pendant l'appui. Une commande en verre grossit au toucher au lieu de pâlir. Respect de Réduire les animations et Réduire la transparence.

Navigation : barre d'onglets flottante en verre dépoli, reproduite d'après la maquette de l'utilisateur (mesures sur un écran de 440 pt) : 62 pt de haut, marges de 21 pt, rail en retrait de 9 pt, lentille 10 pt plus large que l'onglet et en retrait de 4 pt, icônes pleines dessinées en SVG (boîte de 28 pt), libellés de 11 pt ; une lentille marque l'onglet actif et suit le doigt quand on glisse le long de la barre (étirement selon la vitesse, icônes grossies, retour élastique). Un balayage horizontal de la page change aussi d'onglet, sauf sur les zones marquées `data-sans-balayage`.

Fiche mot : latin en grand, arabe dessous (affiché par défaut, masquable dans Profil), traduction, note d'usage s'il y en a, boutons « Écouter » et « Ralenti » (0,75×), lecture automatique à l'ouverture, explication de prononciation, explication de chaque son particulier du mot, exemple avec son audio ; en bas, « Ajouter aux favoris » et « Signaler une erreur » (motif : la traduction, l'écriture, la prononciation).

Session du jour (style Duolingo, plein écran) : jusqu'à 8 révisions dues et 5 nouveaux mots dans l'ordre du programme. Chaque nouveau mot est présenté (« Nouveau mot ») puis exercé ; les nouveaux mots puis les révisions finissent par « Associe les paires » ; entre les deux, une question « Distingue les sons » sur un son présent dans les mots de la session. Barre de progression, croix pour quitter, retour immédiat (vert « Bravo ! » ou rouge avec la bonne réponse, petit son, mot rejoué). Une question ratée revient en fin de session. Bilan avec confettis : XP, taux de réussite, série. Sans révision ni mot nouveau : entraînement libre sur 8 mots vus, qui ne change pas la répétition espacée. Pas de cœurs ni de vies.

Exercices : Écoute et choisis, Traduis, Associe les paires, Distingue les sons (fait : « Quel mot entends-tu ? », 14 paires comme 9elb / kelb, 7al / khal, ghali / khali ; traduction montrée après la réponse ; hors répétition espacée), Quiz express (60 s), Dis-le (avec score, à faire).

Mes mots (page cachée) : ouverte uniquement par le lien `https://mcofirty.github.io/Darijapp/#ajout`, sans entrée dans les onglets ni les menus. Formulaire à trois champs obligatoires (français, latin, arabe), validés par la translittération 3 7 9 kh gh ch ; liste de ses mots avec modification et suppression (seuls les mots ajoutés sur l'appareil, jamais ceux du programme), puis liste en lecture seule des mots du programme ; icône d'envoi sur chaque mot ajouté (feuille de partage de l'iPhone, sinon copie du lien), donc après l'avoir vu et corrigé, qui produit un lien `…/Darijapp/#mot=[latin, arabe, français]` : l'ouvrir affiche le mot et ne l'ajoute qu'après confirmation (jamais deux fois) ; pas de bouton de retour vers l'appli ; un message d'accueil s'adresse à la personne qui ajoute les mots (demande de l'utilisateur, prénoms visibles dans le repo public). Les mots ajoutés passent en tête des nouveaux mots des sessions, entrent dans la répétition espacée, le dictionnaire et les leurres, et sont lus par la synthèse vocale. Ils restent sur l'appareil.

Aide à l'installation : à chaque ouverture dans Safari sur iPhone ou iPad (jamais dans l'appli installée, ni sur Android ou ordinateur, ni sur `#ajout` et `#mot=`), une feuille en verre monte du bas : logo, « Ajoute Darijaapp à ton écran d'accueil », phrase mise en avant « L'ajout à l'écran d'accueil enregistre ta progression. Dans Safari, elle peut être effacée. » (Safari efface les données d'un site non installé après 7 jours sans visite), 4 étapes (Partager, ou « ⋯ » d'abord sur iOS 26 ; « Sur l'écran d'accueil » ; « Ajouter » ; ouvrir depuis l'icône), bulle ronde « Ne plus afficher » et bouton « Compris ». Sans la bulle cochée, elle revient à l'ouverture suivante.

Animation d'ouverture : à chaque lancement à froid (pas sur `#ajout` ni `#mot=`), la vidéo de l'utilisateur (`public/lancement.mp4`, 3 s, sombre, sans son : logo, « Darija », « Le marocain, à l'oral d'abord. », « Projet indépendant réalisé par Romain Innocenzi ») joue en plein écran sur fond #0d0c0f, puis s'efface en fondu sur l'appli ; un toucher la passe ; avec Réduire les animations, ou si la vidéo ne démarre pas en 2 s (mode Économie d'énergie), l'image finale s'affiche 1 s. L'aide à l'installation attend sa fin.

Mode écoute (Apprendre > Explorer) : réglages « Répéter le darija au ralenti » et « Traduction en français » ; listes « À revoir en priorité » (30 mots vus les moins sus), « Tous mes mots vus », ou un thème, avec nombre de mots et durée ; lecteur plein écran : darija, 1,8 s pour le répéter, darija à 0,75×, français (voix française du téléphone), mot suivant ; précédent, pause, suivant ; écran gardé allumé (Wake Lock) ; titre du mot et commandes sur l'écran verrouillé quand iOS les propose (Media Session). Ne compte ni XP ni série.

Fonctions complémentaires : premier lancement guidé, remplacer l'audio d'un mot, signaler un mot, mots difficiles, favoris, mode écoute, rappel en fichier .ics, mode sans micro.

## Règles métier

- **Translittération** : 3 = ع, 7 = ح, 9 = ق, kh = خ, gh = غ, ch = ش ; 2 = ء (hamza, mots importés, non vérifié) ; accents permis dans les mots empruntés au français (supermarché, reçu). Appliquée partout, sans exception : chaque lettre arabe de cette liste a sa graphie latine dans le mot et l'exemple (vérifié par `data.test.ts`). ق prononcé « g » s'écrit g / ڭ. L'article assimilé se double en latin quand l'arabe l'écrit (ssba7 = الصباح, llil = الليل). Le latin et l'arabe d'un même mot ou exemple disent exactement la même chose.
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

Paires de sons (`src/data/sons/paires.json`, hors des thèmes) : `mots` (`id` = `son-<latin>`, `latin`, `arabe`, `fr`, `audio` = `audio/<id>.mp3`, générés par l'Action) et `paires` (`a`, `b`, `sons` : le son de chacun, « rien » quand le second mot n'a pas de son à la place).

L'id suit `<theme>-NNN` dans l'ordre du fichier ; `src/data/data.test.ts` vérifie le format, l'unicité (latin + arabe) et la translittération.

`audio` = `audio/<id>.mp3` (et `audio/<id>-ex.mp3` pour l'exemple, s'il y en a un) : l'Action génère le MP3 s'il manque. Tant qu'il manque, ou si `audio` est vide, la voix de l'iPhone lit l'arabe.

Mot importé (1 530 entrées) : `"prononciation": ""`, `"exemple"` aux quatre champs vides, et parfois `"note": "Emprunt courant au français"`. Une même graphie latine peut désigner deux mots différents en arabe (7it = حيت « parce que » ou حيط « mur »).

Activité terminée (IndexedDB, table `sessions`, depuis la v2 ; `type` = `session`, `quiz` ou `express`, absent sur les sessions d'avant le Quiz) :

```json
{ "id": 1, "date": "2026-10-12", "xp": 27, "bonnes": 12, "mauvaises": 0, "nouveaux": 5, "type": "session" }
```

Mot ajouté (IndexedDB, table `motsPerso`, depuis la v3) :

```json
{ "id": "perso-<uuid>", "latin": "khobz", "arabe": "خبز", "fr": "pain", "creeLe": 1760300000000 }
```

Favori ou signalement (IndexedDB, table `marques`, depuis la v4 ; supprimé quand il n'y a plus ni l'un ni l'autre) :

```json
{ "id": "salutations-012", "favori": true, "signale": "traduction", "date": 1760300000000 }
```

Progression d'un mot (IndexedDB ; ses champs `favori` et `signale` ne servent pas) :

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
- mms-tts-ara lit l'arabe sans voyelles (lettres arabes seules) : impossible de lui indiquer les voyelles du darija. Le journal de l'Action « Publier » affiche les textes lus : le vérifier avant de conclure.
- La voix lit le champ `arabe` : c'est lui qui fixe la prononciation entendue. Quand l'arabe d'un mot change, supprimer ses MP3 pour qu'ils soient régénérés.
- Un `backdrop-filter` (ou `filter`, `opacity`, `mask`) sur un élément en fait une racine d'arrière-plan : ses enfants ne voient plus la page derrière. Les couches de verre sont donc sur `::before`/`::after`, jamais sur l'élément `.verre` lui-même.
- Les classes de `src/index.css` vivent dans `@layer components` : hors couche, elles écraseraient les utilitaires Tailwind (une `position: relative` avait fait disparaître la barre du bas).
- Les couleurs de texte éclaircies du mode sombre (#ff6961, #2fd27f) ne supportent pas de texte blanc : tout bouton plein utilise `--accent-plein` ou `--vert-plein` (couleurs du drapeau, 5,8:1 et 7,5:1).
- `overflow-x: hidden` sur un conteneur en fait une zone de défilement : `position: sticky` à l'intérieur ne colle plus à la fenêtre. Utiliser `overflow-x: clip` (racine de `App.tsx`).
- `opacity` sur un élément `.verre` (ex. `.pressable:active`) en fait une racine d'arrière-plan : le verre devient opaque pendant l'appui. Les commandes en verre grossissent au toucher, sans opacité.
- Le Chromium de Playwright ne lit pas le H.264 (erreur 4 sur `lancement.mp4`) : pour tester la lecture de la vidéo d'ouverture, servir une copie en VP9 (`ffmpeg -c:v libvpx-vp9`), sans la commiter.
- Un commit poussé par l'Action (`GITHUB_TOKEN`, `github-actions[bot]`) ne déclenche aucun workflow `push` : « Publier » est relancée par `workflow_run` à la fin d'« Audio ». Les deux Actions font un checkout de `main` et non du commit déclencheur, qui n'a pas les MP3 ajoutés entre-temps par le bot.
- Safari n'envoie pas toujours l'événement de fin de `speechSynthesis` : `parler()` (`src/audio/lecteur.ts`) a un délai de secours selon la longueur du texte, sans quoi le mode écoute resterait bloqué.
- Après la génération des MP3, mets à jour la liste des fichiers mis en cache par la PWA pour que l'audio marche hors ligne.

## Façon de travailler

1. En début de session : lis ce fichier, regarde « État du projet », lance les tests.
2. Pour chaque demande : propose un plan court et attends la validation avant de coder.
3. Code, puis écris ou mets à jour les tests.
4. Mets à jour ce fichier (règles ci-dessous), puis fais le commit.

## État du projet

Jalon en cours : **3 — Prononciation** (Distingue les sons, mode écoute, puis Dis-le). Les jalons 1 et 2 sont en ligne sur https://mcofirty.github.io/Darijapp/.

| Jalon | Durée estimée | Contenu | Statut |
| --- | --- | --- | --- |
| 1. Socle | Semaine 1 | PWA, 5 onglets, script audio, 1 thème de 10 mots (fait : 8 thèmes, 152 mots, 304 MP3) | Terminé |
| 2. Exercices | Semaines 2 et 3 | Cartes, quiz, répétition espacée | Terminé |
| 3. Prononciation | Semaines 4 et 5 | Enregistrement, score sur 100, sons du darija | En cours |
| 4. Jeu et contenu | Semaines 6 et 7 | Quêtes, séries, parcours complet, 150 mots (fait : 1 682 mots en 31 thèmes) | À faire |
| Ensuite | — | Grammaire, dialogues, 500 mots | Plus tard |

## Fonctionnalités livrées

| Date | Fonctionnalité | Fichiers clés |
| --- | --- | --- |
| 2026-10-10 | Jalon 1 : socle PWA à 5 onglets, base Dexie, 152 mots en 8 thèmes avec fiche mot, guide des sons et dictionnaire, lecture audio avec repli sur la voix du téléphone, Action qui génère l'audio, teste et publie | `src/app/`, `src/db/`, `src/data/`, `src/features/`, `src/audio/lecteur.ts`, `.github/workflows/publier.yml` |
| 2026-10-12 | Design d'Apple (iOS 26) : couleurs du drapeau et apparence clair / sombre, grands titres, listes groupées et angles aux mesures des Réglages, Liquid Glass sur toutes les commandes, barre d'onglets flottante d'après la maquette de l'utilisateur avec balayage | `src/index.css`, `src/ui/`, `src/app/BarreOnglets.tsx`, `src/app/apparence.ts` |
| 2026-10-12 | Relecture du contenu : 40 mots ou exemples corrigés (ch7al, derhem/drahem, lma, 9ahwa k7la, maticha, articles alignés entre latin et arabe…) et test de cohérence latin/arabe | `src/data/*.json`, `src/data/data.test.ts` |
| 2026-10-12 | Logo de l'appli (bulles « A » et « ش ») en favicon, icône d'écran d'accueil et icônes PWA | `public/logo-*.png` (copies `favicon.png` et `apple-touch-icon.png` pour les anciennes versions en cache) |
| 2026-10-12 | Page cachée « Mes mots » (`#ajout`) : ajout, modification, suppression de mots intégrés aux sessions, et partage d'un mot par lien (`#mot=`) avec confirmation ; base v3 | `src/features/ajout/`, `src/db/motsPerso.ts`, `src/data/motsPerso.ts`, `src/app/App.tsx` |
| 2026-10-12 | Session du jour style Duolingo en écran d'accueil : découverte, Écoute et choisis, Traduis, Associe les paires, bilan ; répétition espacée, XP, niveaux, série ; base v2 | `src/features/session/`, `src/exercices/`, `src/srs/`, `src/gamification/`, `src/db/apprentissage.ts` |
| 2026-10-12 | Voix marocaine Jamal par Azure Speech pour les 1 682 mots et 152 exemples (Action, secrets GitHub), MP3 gardés sur le téléphone à la première écoute | `scripts/generate_audio.py`, `.github/workflows/publier.yml`, `vite.config.ts`, `src/data/*.json` |
| 2026-10-12 | Import de 1 530 mots et phrases du fichier de l'utilisateur (1 739 entrées, doublons retirés) en 23 nouveaux thèmes et 7 thèmes existants, arabe écrit par Claude, lus par la voix de l'iPhone ; note d'usage sur la fiche | `src/data/*.json`, `src/data/themes.ts`, `src/ui/visuels.ts`, `src/data/data.test.ts`, `scripts/generate_audio.py` |
| 2026-10-12 | Nom « Darijaapp » (icône d'écran d'accueil, titre) et feuille d'aide à l'installation sur l'écran d'accueil avec « Ne plus afficher » | `src/features/onboarding/AideInstallation.tsx`, `src/app/installation.ts`, `vite.config.ts`, `index.html` |
| 2026-10-12 | Mise en ligne en 2 min, séparée de la génération audio ; Dictionnaire affiché progressivement | `.github/workflows/publier.yml`, `.github/workflows/audio.yml`, `src/features/mots/ListeMots.tsx` |
| 2026-10-13 | Onglet Quiz : quiz de 5 questions sur les mots les moins sus et Quiz express de 60 s avec record | `src/features/quiz/`, `src/exercices/quiz.ts`, `src/db/apprentissage.ts`, `src/features/session/` |
| 2026-10-13 | Distingue les sons : 14 paires (9elb / kelb…) avec voix Jamal, une question par session et par quiz, et mini-jeu Chasse aux sons avec combo et record | `src/data/sons/paires.json`, `src/data/pairesSons.ts`, `src/features/session/Distingue.tsx`, `src/features/quiz/Chrono.tsx`, `src/exercices/` |
| 2026-10-13 | Mode écoute mains libres : darija, temps pour répéter, darija ralenti, français, sur ses mots à revoir ou un thème | `src/features/ecoute/`, `src/exercices/ecoute.ts`, `src/audio/lecteur.ts` |
| 2026-10-13 | Favoris, mots difficiles (à réviser ou écouter) et « Signaler une erreur » avec liste à envoyer ; base v4 | `src/db/marques.ts`, `src/exercices/selections.ts`, `src/features/apprendre/ListeSpeciale.tsx`, `src/features/profil/MotsSignales.tsx`, `src/features/mots/FicheMot.tsx` |
| 2026-10-12 | Animation d'ouverture : vidéo de 3 s de l'utilisateur sur fond sombre à chaque lancement, passée d'un toucher, image finale avec Réduire les animations ou si la vidéo ne démarre pas | `public/lancement.mp4`, `public/lancement-fin.jpg`, `src/app/lancement.ts`, `index.html` |

## Décisions

- 2026-10-11 : appli 100 % locale, publiée sur GitHub Pages. Pas de serveur ni de compte à maintenir.
- 2026-10-11 : score par comparaison acoustique MFCC + DTW sur l'appareil. Hors ligne, et la voix reste privée.
- 2026-10-11 : rappel quotidien par fichier .ics. Une notification push exigerait un serveur.

- 2026-10-10 : les 8 thèmes (152 mots) sont écrits dès le jalon 1, à la demande de l'utilisateur, au lieu d'un seul thème de 10 mots.
- 2026-10-10 : l'écriture arabe s'affiche par défaut à côté du latin (demande de l'utilisateur) ; le réglage du Profil permet de la masquer.
- 2026-10-10 : champ `prononciation` obligatoire et `exemple.arabe` ajoutés au format des mots, pour l'explication affichée et pour la synthèse de l'exemple.
- 2026-10-10 : sans MP3, l'appli lit l'écriture arabe avec la synthèse vocale du téléphone (voix arabe) ; la liste des MP3 présents est fixée au build (`__AUDIOS__` dans `vite.config.ts`).
- 2026-10-11 : publication et génération des MP3 par GitHub Actions, pour que tout se fasse sans ordinateur (l'utilisateur n'utilise que son iPhone).
- 2026-10-11 : repo public, pour que GitHub Pages soit gratuit ; aucune donnée personnelle dans le repo, le prénom de l'utilisateur a été retiré des exemples.
- 2026-10-12 : design d'Apple en PWA (demandes de l'utilisateur) : Liquid Glass en CSS (deux couches `backdrop-filter` en pseudo-éléments, liseré et dispersion en ombres internes, Pointer Events, sans bibliothèque ; Safari n'accepte pas de filtre SVG dans `backdrop-filter`, donc pas de vraie réfraction, et `glassEffect` de SwiftUI ne vaut que pour les applis natives), réservé aux commandes ; fond système gris, listes groupées, grands titres ; retour réduit à un chevron dans un rond en verre (nom de la page précédente gardé pour VoiceOver) ; bord de défilement flou ; icônes Lucide (licence des SF Symbols réservée aux applis Apple) ; animations coupées avec « Réduire les animations ».
- 2026-10-12 : nouveaux mots illimités (demande de l'utilisateur) : 5 par session, autant de sessions que voulu ; pas de cœurs ni de blocage.
- 2026-10-12 : la session du jour remplace les « 5 cartes du jour » du cahier des charges ; les exercices Dis-le et Distingue les sons y entreront au jalon 3.
- 2026-10-12 : les réponses ne sont enregistrées qu'en fin de session ; quitter en cours de route ne change rien, pour garder la répétition espacée cohérente.
- 2026-10-12 : la série est calculée à partir de l'historique des sessions (table `sessions`), sans compteur stocké, pour qu'elle ne puisse pas se désynchroniser.
- 2026-10-12 : sons de retour synthétisés par Web Audio, sans fichier à télécharger.
- 2026-10-12 : couleurs principales du drapeau marocain (demande de l'utilisateur), à la place de l'orange ; erreurs en rouge et réussites en vert restent lisibles car toujours accompagnées d'une icône (croix, coche).
- 2026-10-12 : réglage d'apparence stocké dans le profil Dexie (`apparence`), copié dans localStorage uniquement pour l'appliquer avant le premier affichage (sans flash) ; Dexie reste la référence.
- 2026-10-12 : import du fichier de 1 739 entrées (demande de l'utilisateur) : les 130 mots déjà présents (même latin ou variante, comme mr7ba/mar7ba) gardent leur version et leur progression ; doublons du fichier fusionnés (sens réunis par « / ») ; thèmes recoupant un thème existant fusionnés, les autres en 23 thèmes ajoutés ; niveau 1, 2 ou 3 selon le numéro du thème (1-10, 11-21, 22-31) ; latin corrigé seulement quand il contredisait l'arabe (sahb → sa7b, qbel → 9bel…), ṭ, ṣ, ə remplacés par t, s, e.
- 2026-10-12 : retour à de vrais MP3, voix Jamal par l'API officielle Azure Speech (demande de l'utilisateur, qui a créé le compte et les secrets) : edge-tts était bloqué (403) et les voix iPhone / mms lisent de l'arabe standard. Écart assumé à « aucune clé d'API » : la clé ne sert que dans l'Action, jamais dans l'appli ni le repo. Offre F0 : 500 000 caractères par mois (le programme en pèse 13 000) et 20 requêtes par minute, d'où un fichier toutes les 3,2 s et une première génération d'environ 1h30 ; l'Action est prévue pour reprendre où elle s'est arrêtée.
- 2026-10-12 : MP3 hors du précache de la PWA (cache à l'exécution `CacheFirst` avec `rangeRequests`, indispensable à Safari pour lire l'audio depuis le cache) : le premier chargement reste léger, chaque mot écouté une fois marche ensuite hors ligne. Un mot jamais écouté hors ligne retombe sur la voix de l'iPhone.
- 2026-10-12 : l'appli s'appelle « Darijaapp » (demande de l'utilisateur) : nom du manifeste, nom sous l'icône (`apple-mobile-web-app-title`) et titre de la page. L'adresse reste …/Darijapp/ (nom du repo).
- 2026-10-12 : « Ne plus afficher » de l'aide à l'installation stocké dans le profil Dexie (`masquerAideInstallation`, champ non indexé, sans migration) ; l'aide attend la lecture du profil pour ne pas clignoter.
- 2026-10-12 : alertes de l'appli (composant `Alerte`, rendu dans `document.body`) au lieu de `window.confirm`, qui affiche une boîte Safari impossible à styler.
- 2026-10-12 : « Mes mots » n'est joignable que par `#ajout` (hash lu dans `App.tsx`, sans routeur) : caché, pas protégé (repo public) ; mots ajoutés aux trois champs obligatoires, lus par la synthèse vocale, placés avant le programme dans `tousLesMots()` (le programme reste `MOTS`, JSON statique ; la logique et les écrans lisent `tousLesMots()` / `useMots()`) ; les mots d'une autre personne arrivent par un lien partagé (feuille de partage iOS) qui contient le mot, rien n'étant stocké en ligne : un jeton GitHub serait public, un serveur contredirait le 100 % local ; ajout après confirmation et validation de la translittération.
- 2026-10-12 : angles continus d'Apple par `corner-shape: superellipse(1.5)` sous `@supports` (Chrome ; Safari garde des arcs aux mêmes rayons), sans `clip-path` ni `mask` qui casseraient le flou du verre ; rayons concentriques en `calc(px + rem)` (Dynamic Type) ; marges et hauteurs de liste en px fixes (`--spacing-marge` 20 px, `--spacing-ligne` 56 px) copiées d'une capture des Réglages, car 1 rem = 17 px dans l'appli.
- 2026-10-12 : animation d'ouverture = la vidéo de l'utilisateur telle quelle (demande de l'utilisateur, nom complet visible accepté dans le repo public) ; voile sombre écrit dans `index.html` pour éviter un flash blanc avant le JS ; vidéo précachée et lue depuis un blob, car Safari la demande par requêtes Range que le précache de la PWA ne sert pas.
- 2026-10-12 : génération audio et mise en ligne séparées en deux Actions : une génération de 1h30 bloquait la publication de tout changement de code (et l'exécution suivante, partie d'un commit sans les MP3, aurait tout regénéré).
- 2026-10-12 : listes de mots affichées par tranches (60, puis 120 à l'approche du bas, `IntersectionObserver`) au lieu des 1 682 lignes d'un coup.
- 2026-10-13 : le Quiz contrôle sans réviser : il n'écrit pas dans la répétition espacée (des mots jamais vus peuvent le compléter) mais compte pour l'XP et la série ; il se compte par question, les paires justes seulement sans aucune erreur. Record du Quiz express dans le profil (`recordExpress`, champ non indexé, sans migration).
- 2026-10-13 : les mots des paires de sons sont à part du programme (fichier hors des thèmes, ids `son-…`) et ne passent jamais par la répétition espacée (`Resultats.compter`) : ce sont des exemples d'écoute, pas du vocabulaire à apprendre. Record de la Chasse aux sons dans le profil (`recordSons`).
- 2026-10-13 : mode écoute avec l'écran gardé allumé (Wake Lock) plutôt qu'en arrière-plan : la synthèse vocale de l'iPhone (voix de secours et français) s'arrête quand l'écran se verrouille.
- 2026-10-13 : favoris et signalements dans une table à part (`marques`, v4) et non dans la progression : marquer un mot jamais vu l'aurait compté comme vu et retiré des nouveaux mots.
- 2026-10-10 : pas de routeur ; navigation par état React, suffisante pour 5 onglets.

## Points en suspens

- Voix : MP3 Jamal générés par l'Action « Audio » (secrets `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION`) ; si Azure refuse (401/403), vérifier la clé, la région et le niveau F0. Tant qu'un MP3 manque, la voix de l'iPhone lit (arabe standard).
- Score de prononciation (jalon 3) : les MP3 Jamal serviront de référence (MFCC + DTW) ; envisagé : ajouter la voix féminine Mouna (`ar-MA-MounaNeural`) et garder la meilleure des deux notes. Enregistrement et auto-évaluation à construire.
- Le contenu a été relu et corrigé par Claude (cohérence latin/arabe, tournures), mais pas par un locuteur natif : signaler les erreurs pour corriger les JSON. L'arabe des 1 530 mots importés a été écrit par Claude d'après le latin et le français, sans relecture.
- Mots importés : pas d'explication de prononciation ni d'exemple (la fiche montre seulement les sons 3, 7, 9, kh, gh, ch).
- Mode écoute : vérifier sur iPhone que la lecture continue écran allumé, et si les commandes de l'écran verrouillé apparaissent.
- Le Dictionnaire montre tous les mots, avec un ✓ sur ceux déjà vus (le cahier des charges ne prévoyait que les mots vus).
- Sur iPhone, l'appli installée sur l'écran d'accueil a sa propre mémoire, séparée de Safari (non vérifié sur appareil) : la progression faite dans Safari ne suit pas, et un lien `#mot=…` ouvert dans Safari ajoute sans doute le mot à Safari, pas à l'appli installée. À vérifier, puis prévoir un contournement (copier le lien et l'ouvrir dans l'appli, ou export/import).
- Mes mots : pas de sauvegarde tant que l'export/import du Profil n'existe pas (effacer les données du site efface les mots ajoutés). Pas de prononciation ni d'exemple pour ces mots.

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
