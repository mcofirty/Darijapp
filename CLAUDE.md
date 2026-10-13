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
| Score de prononciation | MFCC + DTW écrits dans `src/scoring/` (sans bibliothèque), rééchantillonnage à 16 kHz maison, réglage sur la voix de l'utilisateur |
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
  audio/          lecture des mots (MP3, sinon synthèse vocale du téléphone), micro et décodage (`micro.ts`)
  features/
    mots/         fiche d'un mot, liste de mots, bouton audio (partagés)
    session/      session du jour : carte d'accueil, étapes (dont Dis-le), retour, bilan
    apprendre/    accueil (session du jour, guide des sons, thèmes), puis mots difficiles
    ecoute/       mode écoute mains libres (choix, lecteur)
    parcours/     voyage en 10 étapes, trésors, passeport
    quiz/         quiz de 5 questions, 5 types d'exercices
    progres/      tableau de bord, quêtes, série, statistiques, dictionnaire
    profil/       réglages, rappel .ics, sauvegarde, mots signalés
    parler/       grammaire orale (fiches et entraînement), dialogues
    jeu/          quêtes du jour et théière, semaine, collection, badges, souk, plante et « Mon jardin »
    onboarding/   premier lancement
    ajout/        page cachée « Mes mots » (lien #ajout) : ajouter, modifier, supprimer ses mots
  srs/            répétition espacée et dates locales (logique pure)
  exercices/      moteur d'exercices : composition d'une session, leurres, résultats (logique pure)
  scoring/        score de prononciation : MFCC, DTW, barème, réglage sur la voix (logique pure)
  gamification/   XP, niveaux, série, quêtes, collection, badges (logique pure)
  sauvegarde/     format du fichier de sauvegarde, rappel .ics (logique pure)
  db/             schéma Dexie et migrations, plan et enregistrement des sessions, mots ajoutés, résumé en direct
  data/           un fichier JSON par thème, liste des thèmes, sons du darija, paires de sons (`sons/paires.json`), grammaire et dialogues (`parler/`)
scripts/
  generate_audio.py
public/audio/     MP3 générés par l'Action (voix Jamal)
docs/
  cahier-des-charges.md
```

## Écrans

| Onglet | Contenu |
| --- | --- |
| Apprendre | Écran d'accueil. Grand titre avec la série (flamme). Carte « Session du jour » (nouveaux mots, révisions, mots vus, « Commencer » puis « Encore une session », sans limite), « Quêtes du jour » (3 quêtes, 3 verres de thé, théière +60 XP ; « Ouvrir la théière » lance une fenêtre flottante sans fond : la théière arrive, verse le thé sur la plante, qui pousse avec les 60 XP, « +60 XP », puis tout s'efface en 3,8 s ; un toucher la ferme), section « Ma progression » (plante du jardin, niveau, barre d'XP ; la toucher ouvre « Mon jardin » ; « Le souk » avec le solde de dirhams), puis « Parler » (Dialogues, Grammaire orale), puis « Explorer » : mode écoute, mes favoris, mots difficiles (ratés et en boîte 1 ou 2 ; listes avec « Réviser » = entraînement libre sur 8 mots, et « Écouter »), guide des sons et 31 thèmes en liste groupée, fiches mots |
| Parcours | Voyage au Maroc en 10 étapes (Tanger, Tétouan, Chefchaouen, Fès, Meknès, Rabat, Casablanca, Marrakech, Essaouira, Merzouga) qui couvrent les 31 thèmes, sur une route qui serpente ; « Prochaine étape » = la première sans tampon ; anneau des mots retenus ; tampon quand 80 % des mots de l'étape sont retenus (boîte 2 ou plus) ; entre deux étapes, un trésor (+100 XP) qui s'ouvre avec le tampon d'avant ; page d'étape (thèmes, « Commencer une leçon » : 5 nouveaux mots de l'étape et ses révisions dues, sinon entraînement libre) ; « Mon passeport » : un tampon à l'encre de chaque ville |
| Quiz | Trois cartes. « Contrôle tes acquis » : quiz de 5 questions (Écoute et choisis ou Traduis, une Distingue les sons, une Dis-le et une Associe les paires, ces deux-là jamais en premier) sur les mots les moins sus (boîte, échecs, retard), complétés par le début du programme ; aucune question refaite ; bilan « x sur 5 », « Sans faute ! ». « Quiz express » : 60 s, questions enchaînées sans « Continuer » (réponse affichée 0,45 s), chrono qui rougit à 10 s, score, record gardé dans le profil. « Chasse aux sons » : même chrono avec des questions Distingue les sons, combo (dès la 5e bonne réponse d'affilée, chacune vaut 2 points), record en points. « Marchandage au souk » : 2 articles par partie (tapis, babouches, théière, lanterne, épices) ; le marchand annonce 3 prix décroissants (phrases à voix Jamal, `src/data/jeux/marchandage.json`), à reconnaître parmi 4 montants, et on répond « ghali bzaf », « ch7al akher tmen? », « safi, ghadi nakhdou » (mots du programme) ; remise affichée. « Le taxi » : 3 courses sur un plan de 5 × 5 ; le passager dit sa destination puis ses consignes (sir / kmmel nichan, dour 3la limen / lisser, 7bes hna, mots du programme), on choisit la direction, le taxi avance. Quiz, Quiz express, Chasse aux sons et mini-jeux donnent de l'XP et comptent pour la série, sans toucher à la répétition espacée |
| Progrès | Contrôle segmenté Tableau de bord / Dictionnaire / Mon jardin. Tableau : niveau et XP restants (toucher la ligne passe à « Mon jardin »), XP total, série avec les 7 derniers jours (flammes) et « Série sécurisée », XP et activités du jour, quêtes du jour, « Ma collection » (or, argent, bronze, vers l'objectif de 300 mots), 12 badges, mots vus. Dictionnaire : recherche iOS, tous les mots avec une pastille bronze / argent / or sur ceux déjà vus. Mon jardin : le contenu de la page « Mon jardin » (ci-dessous), « Décorer au souk » ouvre le souk avec retour à Progrès |
| Profil | Fait : Apparence (Automatique / Clair / Sombre), écriture arabe, Rappel (heure, « Ajouter au Calendrier » : fichier .ics quotidien avec alerte), Sauvegarde (exporter la progression en JSON par la feuille de partage, importer après confirmation, tout ou rien), Prononciation (interrupteur « Micro » : sans lui, Dis-le passe en auto-évaluation ; « Régler le score sur ma voix » : répéter 4 mots faciles après Jamal, un essai qui ressemble à un autre mot est redemandé une fois), « Mots signalés » (liste à envoyer ou copier, pour les corriger avec Claude). Moi (Genre : Masculin / Féminin, masculin par défaut, pour accorder les phrases). Prévu : prénom, avatar, objectif, audio, remise à zéro |

Design : règles d'Apple (Human Interface Guidelines, iOS 26). Couleurs sémantiques système en clair et en sombre (`src/index.css` : fond groupé, cartes, libellés primaire/secondaire, séparateurs), couleurs principales du drapeau marocain : rouge #C1272D pour l'accent et les boutons, vert #006233 pour les réussites (`--accent`/`--vert` pour le texte, éclaircis en sombre ; `--accent-plein`/`--vert-plein` pour les fonds de boutons ; contrastes WCAG AA). Apparence clair/sombre réglable dans Profil (Automatique, Clair, Sombre) : attribut `data-theme` sur `<html>`, variante `dark:` de Tailwind redéfinie en conséquence. Typographie système SF Pro avec l'échelle iOS (classes `.t-grand-titre` à `.t-legende`, en rem sur le corps 17 pt, Dynamic Type via `-apple-system-body`). Chaque écran a un grand titre ; au défilement, le titre passe en petit au centre et le contenu s'efface sous un bord flou (`.bord-flou`, effet de bord d'iOS 26) ; le retour est un chevron seul dans un bouton rond en verre. Contenu en listes groupées façon Réglages, mesurées sur une capture de l'utilisateur (écran de 440 pt) : marge des pages 20 pt (`px-marge`), cellules de 56 pt minimum (`min-h-ligne`), texte à 20 pt du bord de la carte, séparateurs alignés sur le texte et arrêtés à 20 pt du bord droit, titres de section en 17 pt semi-gras gris sans majuscules, tuiles d'icônes colorées, chevrons. Angles d'iOS 26 (jetons `--radius-*` de `src/index.css`, classes `rounded-liste`…) : listes et cartes 26 px, tuiles d'icônes 8 px, réponses des exercices en capsule, logo à 22,37 % ; un conteneur qui entoure un bouton en capsule est concentrique (rayon du bouton + marge : panneaux en verre, carte Session du jour, alertes, aide à l'installation, carte « Thème » du Profil avec son contrôle segmenté, via la prop `arrondi` de `Section`) ; angles continus (`corner-shape: superellipse`) là où le navigateur les dessine, capsules exclues. Liquid Glass (`.verre` : verre clair au centre, bande de bord plus réfractante, liseré lumineux, légère dispersion colorée ; `.verre-fin` pour les petites commandes ; `.verre-epais` pour les alertes et la recherche, plus opaque pour rester lisible ; `.lentille-goutte` pour les curseurs pendant le geste) réservé aux commandes : barre d'onglets, boutons de barre (retour, série), croix et capsule de progression de la session, panneaux « Continuer » et du bilan, champ de recherche collant du Dictionnaire, alertes (composant `Alerte`, à la place de `window.confirm`) ; jamais sur le contenu. Contrôle segmenté façon iOS 26 : capsule grise, libellés sur une ligne (13 à 15 pt selon la largeur de l'écran), curseur en verre clair au repos (`.verre-curseur`) ; pendant l'appui ou le glissement, il devient une goutte de verre qui suit le doigt, puis revient avec un rebond. Interrupteur : la pastille devient une goutte de verre pendant l'appui. Une commande en verre grossit au toucher au lieu de pâlir. Respect de Réduire les animations et Réduire la transparence.

Navigation : barre d'onglets flottante en verre dépoli, reproduite d'après la maquette de l'utilisateur (mesures sur un écran de 440 pt) : 62 pt de haut, marges de 21 pt, rail en retrait de 9 pt, lentille 10 pt plus large que l'onglet et en retrait de 4 pt, icônes pleines dessinées en SVG (boîte de 28 pt), libellés de 11 pt ; une lentille marque l'onglet actif et suit le doigt quand on glisse le long de la barre (étirement selon la vitesse, icônes grossies, retour élastique). Un balayage horizontal de la page change aussi d'onglet, sauf sur les zones marquées `data-sans-balayage`.

Fiche mot : latin en grand, arabe dessous (affiché par défaut, masquable dans Profil), traduction, note d'usage s'il y en a, boutons « Écouter » et « Ralenti » (0,75×), lecture automatique à l'ouverture, explication de prononciation, explication de chaque son particulier du mot, exemple avec son audio ; en bas, « Ajouter aux favoris » et « Signaler une erreur » (motif : la traduction, l'écriture, la prononciation).

Session du jour (style Duolingo, plein écran) : jusqu'à 8 révisions dues et 5 nouveaux mots dans l'ordre du programme. Chaque nouveau mot est présenté (« Nouveau mot ») puis exercé ; les nouveaux mots puis les révisions finissent par « Associe les paires » ; après les paires des nouveaux mots, les 2 premiers sont à prononcer (Dis-le ; sans nouveau mot, 2 révisions), puis une question « Distingue les sons » sur un son présent dans les mots de la session ; après les révisions, une « Construis la phrase » (sur une révision, sinon un nouveau mot) et un « Dis-le en darija » sur une révision en boîte 2 ou plus (aussi dans les leçons du Parcours ; « Mots difficiles » n'a que la phrase). Barre de progression, croix pour quitter, retour immédiat (vert « Bravo ! » ou rouge avec la bonne réponse, petit son, mot rejoué). Une question ratée revient en fin de session. Bilan avec confettis : XP, taux de réussite, série. Sans révision ni mot nouveau : entraînement libre sur 8 mots vus, qui ne change pas la répétition espacée. Pas de cœurs ni de vies.

Exercices : Écoute et choisis, Traduis, Associe les paires, Distingue les sons (fait : « Quel mot entends-tu ? », 14 paires comme 9elb / kelb, 7al / khal, ghali / khali ; traduction montrée après la réponse ; hors répétition espacée), Quiz express (60 s), Dis-le (fait : mot, « Écouter » et « Ralenti », gros bouton micro avec halo qui suit la voix, arrêt seul après 0,8 s de silence ; score sur 100, étoiles, libellé ; « Mon essai », « Le modèle », « Réessayer », « Le score se trompe » qui inverse le résultat ; « Presque » rejoue le modèle, « À retravailler » le rejoue au ralenti et explique les sons difficiles du mot ; validé par « Continuer », jamais refait en fin de session ; auto-évaluation « Je l'ai bien dit » / « À retravailler » sans micro, micro refusé ou sans MP3 de référence, avec « Mon essai » et « Le modèle » quand on a pu s'enregistrer), Dis-le en darija (Dis-le inversé : seul le français, rien n'est lu avant l'essai ; « Indice » montre le début du mot (`3a…`), puis « Voir le darija » ; après l'essai, le darija se dévoile et le modèle est lu ; sans micro, « Montrer la réponse » puis auto-évaluation), Construis la phrase (l'exemple d'un mot, de 3 à 6 mots, est lu ; traduction affichée ; on touche ses mots, mélangés avec 2 intrus pris dans d'autres exemples, pour la reconstruire, un toucher les renvoie ; « Vérifier » ; l'ordre exact est exigé, ponctuation ignorée ; compte pour le mot dans la répétition espacée et revient en fin de session si ratée).

Mes mots (page cachée) : ouverte uniquement par le lien `https://mcofirty.github.io/Darijapp/#ajout`, sans entrée dans les onglets ni les menus. Formulaire à trois champs obligatoires (français, latin, arabe), validés par la translittération 3 7 9 kh gh ch ; liste de ses mots avec modification et suppression (seuls les mots ajoutés sur l'appareil, jamais ceux du programme), puis liste en lecture seule des mots du programme ; icône d'envoi sur chaque mot ajouté (feuille de partage de l'iPhone, sinon copie du lien), donc après l'avoir vu et corrigé, qui produit un lien `…/Darijapp/#mot=[latin, arabe, français, ajouté le]` (la page prévient que l'heure de l'ajout part avec le mot) : l'ouvrir affiche le mot, « Ajouté le 13 octobre 2026 à 9 h 37 » (heure du téléphone qui reçoit), et ne l'ajoute qu'après confirmation (jamais deux fois) ; la liste de ses mots montre aussi cette ligne ; sous le message d'accueil, un bouton « Ouvrir l'application » retire `#ajout` de l'adresse et affiche les onglets (sans rejouer la vidéo d'ouverture) ; un message d'accueil s'adresse à la personne qui ajoute les mots (demande de l'utilisateur, prénoms visibles dans le repo public). Les mots ajoutés passent en tête des nouveaux mots des sessions, entrent dans la répétition espacée, le dictionnaire et les leurres, et sont lus par la synthèse vocale. Ils restent sur l'appareil.

Aide à l'installation : à chaque ouverture dans Safari sur iPhone ou iPad (jamais dans l'appli installée, ni sur Android ou ordinateur, ni sur `#ajout` et `#mot=`), une feuille en verre monte du bas : logo, « Ajoute Darijaapp à ton écran d'accueil », phrase mise en avant « L'ajout à l'écran d'accueil enregistre ta progression. Dans Safari, elle peut être effacée. » (Safari efface les données d'un site non installé après 7 jours sans visite), 4 étapes (Partager, ou « ⋯ » d'abord sur iOS 26 ; « Sur l'écran d'accueil » ; « Ajouter » ; ouvrir depuis l'icône), bulle ronde « Ne plus afficher » et bouton « Compris ». Sans la bulle cochée, elle revient à l'ouverture suivante.

Animation d'ouverture : à chaque lancement à froid (pas sur `#ajout` ni `#mot=`), la vidéo de l'utilisateur (`public/lancement.mp4`, 3 s, sombre, sans son : logo, « Darija », « Le marocain, à l'oral d'abord. », « Projet indépendant réalisé par Romain Innocenzi ») joue en plein écran sur fond #0d0c0f, puis s'efface en fondu sur l'appli ; un toucher la passe ; avec Réduire les animations, ou si la vidéo ne démarre pas en 2 s (mode Économie d'énergie), l'image finale s'affiche 1 s. L'aide à l'installation attend sa fin.

Grammaire orale (Apprendre > Parler) : 6 fiches (négation ma…ch ; possessifs dari, darek ; présent en ka- ; futur ghadi ; passé ; questions wach, fin, chno…), chacune avec la règle en 3 phrases et 7 à 9 formes à écouter (latin, arabe, français, MP3 Jamal) ; « S'entraîner » : 5 questions sur 5 formes différentes (Traduis, Écoute et choisis, Construis la phrase s'il y a une forme de 3 à 6 mots, Écoute et choisis, Dis-le d'une phrase), leurres pris dans la leçon ; comptée comme un quiz (activité `grammaire` : XP, série, dirhams, pas de répétition espacée, pas de question refaite). Dialogues (Apprendre > Parler) : 8 scènes de 4 à 6 répliques (café, taxi, épicier, faire connaissance, chemin, restaurant, pharmacie, téléphone), 2 ou 3 à dire, accordées au genre du Profil (version `feminin` des répliques où l'on parle de soi ou à qui l'on s'adresse) ; liste avec le meilleur résultat (`2/3`) ; scène plein écran : « Écoute la scène » (bulles façon messagerie, l'autre à gauche, toi à droite, touchées pour réécouter, « Tout écouter » / « Arrêter »), puis « À toi de jouer » : les répliques de l'autre apparaissent et sont lues, chacune des tiennes est un Dis-le en darija d'une phrase (français seul, indice, score contre le MP3 de la réplique) validé par « Continuer », bulle cochée ou barrée ; « Terminer », bilan ; activité `dialogue` (XP, série, dirhams), meilleur résultat dans le profil (`dialogues`). Toutes les voix sont Jamal (voix Mouna refusée par l'utilisateur).

Mode écoute (Apprendre > Explorer) : réglages « Répéter le darija au ralenti » et « Traduction en français » ; listes « À revoir en priorité » (30 mots vus les moins sus), « Tous mes mots vus », ou un thème, avec nombre de mots et durée ; lecteur plein écran : darija, 1,8 s pour le répéter, darija à 0,75×, français (voix française du téléphone), mot suivant ; précédent, pause, suivant ; écran gardé allumé (Wake Lock) ; titre du mot et commandes sur l'écran verrouillé quand iOS les propose (Media Session). Ne compte ni XP ni série.

Mon jardin (page ouverte par la barre de niveau d'Apprendre ; troisième choix du menu de Progrès) : scène en SVG (fond, objets, plante en grand dans son pot, qui se balance), stade sur 10, nom, barre et XP avant le stade suivant, les 10 étapes en vignettes, « Décorer au souk », « Revoir sa pousse depuis la graine ». À l'ouverture, la plante pousse en animation depuis l'XP de la dernière visite (depuis la graine la première fois) : chaque stade finit de grandir, puis rebond et étincelles au stade suivant, bandeau « Ta plante a grandi : Tige → Feuilles » ; un toucher passe l'animation, aucune avec « Réduire les animations ». Le souk a deux allées (contrôle segmenté) : « Mon jardin » (6 plantes, 4 décors, 3 objets à afficher ou ranger, 4 pots) et « L'appli » (7 couleurs, 3 jeux de sons écoutables, 3 confettis, 4 zelliges) ; toucher un article de « L'appli » pas encore acheté l'essaie pendant que la fenêtre d'achat est ouverte (« Aperçu : il disparaît si tu n'achètes pas ») : la couleur passe sur toute l'appli, le son est joué (« Réécouter »), les confettis tombent par-dessus (« Revoir »), le zellige s'affiche sur une carte « Session du jour » dans la fenêtre ; « Annuler » rend le décor choisi, « Acheter » le garde. Le bilan affiche les dirhams gagnés et le bonus de précision, et, si l'activité a fait changer la plante de stade, la plante qui pousse en grand avec « Ta plante a grandi ! Graine → Germe ».

Fonctions complémentaires : premier lancement guidé, remplacer l'audio d'un mot, signaler un mot, mots difficiles, favoris, mode écoute, rappel en fichier .ics, mode sans micro.

## Règles métier

- **Translittération** : 3 = ع, 7 = ح, 9 = ق, kh = خ, gh = غ, ch = ش ; 2 = ء (hamza, mots importés, non vérifié) ; accents permis dans les mots empruntés au français (supermarché, reçu). Appliquée partout, sans exception : chaque lettre arabe de cette liste a sa graphie latine dans le mot et l'exemple (vérifié par `data.test.ts`). ق prononcé « g » s'écrit g / ڭ. L'article assimilé se double en latin quand l'arabe l'écrit (ssba7 = الصباح, llil = الليل). Le latin et l'arabe d'un même mot ou exemple disent exactement la même chose.
- **Répétition espacée** (Leitner, boîtes 1 à 4) : un mot raté revient le lendemain (boîte 1) ; un mot réussi revient après 3, 7, puis 21 jours. Un mot compte comme raté s'il a eu au moins une erreur pendant la session.
- **Score de prononciation** : de 0 à 100. 80 et plus : « Excellent », 3 étoiles. De 60 à 79 : « Presque », 2 étoiles. Moins de 60 : « À retravailler », 1 étoile. 60 et plus compte comme réussi (Dis-le entre dans la répétition espacée comme les autres réponses, et ses scores dans `progression.scores`, 20 derniers). « Le score se trompe » inverse le résultat ; s'il fait passer un essai en réussi, sa distance s'ajoute au réglage de la voix. Calcul : essai et référence (MP3 Jamal) rééchantillonnés à 16 kHz, silence retiré (bloc de parole le plus fort ; pauses de 0,35 s au plus dans un mot, de 0,8 s dans une phrase, dont l'enregistrement s'arrête après 1,2 s de silence au lieu de 0,8), 12 MFCC toutes les 5 ms (filtres mel 80-7600 Hz, plancher à -50 dB, centrés et réduits), essai calculé avec 7 étirements de fréquence (0,82 à 1,18, voix plus grave ou plus aiguë) ; DTW, distance moyenne la plus petite ; barème 0,8 → 100, 1,3 → 80, 1,85 → 60, 2,9 → 0, après soustraction du réglage (médiane des distances de mots bien dits moins 1, entre 0 et 1,6).
- **Calibrage du score** (`calibrage.test.ts`, sur les MP3 Jamal des 26 mots des paires) : le même mot ralenti, plus aigu (bande 100-7000 Hz) ou plus grave dépasse 80 ; les deux mots de chacune des 14 paires restent sous 60, sous tous ces rendus. Phrases (`calibragePhrases.test.ts`, phrases des leçons futur et questions, pauses à 0,8 s) : la même phrase plus aiguë ou plus grave reste à 60 ou plus, coupée d'une pause de 0,6 s à 80 ou plus ; une autre phrase de la leçon reste sous 60 (sur les 50 phrases : même phrase 76 au moins, autre phrase 42 au plus).
- **XP** : 1 par bonne réponse, 10 par session terminée, 5 de bonus sans faute.
- **Niveaux** : 120 XP pour le niveau 1, 140 pour le niveau 2, puis 20 XP de plus par niveau. Noms : Terreau, Graine, Germe, Pousse, Tige, Feuilles, Bouton, Fleur, Fruit, puis Arbre.
- **Quêtes** : 3 par jour, renouvelées à minuit heure locale : toujours « Termine une session du jour », plus deux tirées selon la date parmi 8 (2 sessions, sans faute, quiz, Quiz express, Chasse aux sons, 40 XP, 5 nouveaux mots, 10 mots écoutés). Les 3 faites ouvrent la théière-coffre (+60 XP, une fois par jour). Un trésor du Parcours rapporte +100 XP, une seule fois (table `bonus`, `cle` = `tresor-<étape>`).
- **Dirhams et souk** : par activité, 1 DH par bonne réponse plus un bonus de précision (10 DH sans faute, 5 avec une erreur, 2 avec deux) ; 60 par théière, 50 par trésor (tout recalculé depuis l'historique), moins les achats. Le souk ne vend que du décor, de 80 à 400 DH : jardin (oranger, olivier, rosier, palmier, figuier de Barbarie ; riad, ruelle de Chefchaouen, dunes ; lanterne, théière, cigogne ; 3 pots) et appli (6 couleurs d'accent, erreurs toujours en rouge ; sons qraqeb et darbouka synthétisés ; pétales et étoiles ; 3 zelliges). L'article de départ de chaque rayon est gratuit (menthe, ciel, terre cuite, drapeau, sons classiques, confettis, sans zellige).
- **Jardin** : la plante a 10 stades, ceux des niveaux (Terreau à Arbre) ; dans un niveau, elle grandit avec l'avancement (`gamification/jardin.ts`) ; l'arbre a sa pleine taille à la fin du niveau 10.
- **Collection et badges** : un mot vu est en bronze, en argent en boîte 3, en or en boîte 4. 12 badges (première activité, sans faute, 50 / 150 / 300 mots, 10 / 50 mots en or, 3 / 7 / 30 jours d'affilée en record, 15 au Quiz express, 20 à la Chasse aux sons).
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

Profil : en plus des réglages, `micro` (Dis-le avec score), `reglageVoix` (12 dernières distances de mots bien dits) et le décor du souk (`couleur`, `zellige`, `pot`, `espece`, `fond`, `objets` : liste des objets affichés, `sons`, `confettis`) et `jardinXpVu` (XP à la dernière visite de « Mon jardin », point de départ de l'animation, null avant la première), `genre` (`m`, `f` ou null = masculin) et `dialogues` (meilleur nombre de répliques réussies par scène). Progression d'un mot (IndexedDB ; ses champs `favori` et `signale` ne servent pas) :

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
- Micro de l'iPhone : tant qu'il est ouvert, iOS baisse le son de lecture ; `enregistrer()` rend le micro à chaque fin d'enregistrement. Traitements du navigateur (annulation d'écho, réduction de bruit, gain automatique) coupés : ils déforment le spectre. Le runner GitHub n'a pas ffmpeg : « Publier » l'installe pour `calibrage.test.ts`, qui décode dans `beforeAll` (le corps d'un `describe.skipIf` sauté s'exécute quand même). Pour tester Dis-le dans Chromium : `--use-fake-device-for-media-stream --use-file-for-fake-audio-capture=essai.wav` (un WAV qui boucle, avec du silence autour du mot).
- L'environnement cloud de Claude Code ne peut pas joindre mcofirty.github.io (proxy) : vérifier la mise en ligne par l'état du job `deploy`, pas par une requête au site.
- Safari et le service worker gardent les icônes en cache par URL : pour changer une icône, changer aussi son nom de fichier (`logo-*.png`), puis supprimer et réinstaller l'appli sur l'écran d'accueil.
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
- Après la génération des MP3, mets à jour la liste des fichiers mis en cache par la PWA pour que l'audio marche hors ligne.

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
| Ensuite | — | Grammaire, dialogues, 500 mots (fait : grammaire orale en 6 fiches, 8 dialogues, phrases à construire, Dis-le en darija) | En cours |

## Fonctionnalités livrées

| Date | Fonctionnalité | Fichiers clés |
| --- | --- | --- |
| 2026-10-10 | Jalon 1 : socle PWA à 5 onglets, base Dexie, 152 mots en 8 thèmes avec fiche mot, guide des sons et dictionnaire, lecture audio avec repli sur la voix du téléphone, Action qui génère l'audio, teste et publie (le 2026-10-13 : deux Actions, mise en ligne en 2 min ; listes de mots affichées par tranches) | `src/app/`, `src/db/`, `src/data/`, `src/features/`, `src/audio/lecteur.ts`, `.github/workflows/publier.yml` |
| 2026-10-12 | Design d'Apple (iOS 26) : couleurs du drapeau et apparence clair / sombre, grands titres, listes groupées et angles aux mesures des Réglages, Liquid Glass sur toutes les commandes, barre d'onglets flottante d'après la maquette de l'utilisateur avec balayage | `src/index.css`, `src/ui/`, `src/app/BarreOnglets.tsx`, `src/app/apparence.ts` |
| 2026-10-12 | Relecture du contenu (40 corrections, test de cohérence latin/arabe) ; nom « Darijaapp », logo et aide à l'installation avec « Ne plus afficher » | `src/data/data.test.ts`, `public/logo-*.png`, `src/features/onboarding/AideInstallation.tsx`, `src/app/installation.ts` |
| 2026-10-12 | Page cachée « Mes mots » (`#ajout`) : ajout, modification, suppression de mots intégrés aux sessions, et partage d'un mot par lien (`#mot=`) avec confirmation ; base v3 | `src/features/ajout/`, `src/db/motsPerso.ts`, `src/data/motsPerso.ts`, `src/app/App.tsx` |
| 2026-10-12 | Session du jour style Duolingo en écran d'accueil : découverte, Écoute et choisis, Traduis, Associe les paires, bilan ; répétition espacée, XP, niveaux, série ; base v2 | `src/features/session/`, `src/exercices/`, `src/srs/`, `src/gamification/`, `src/db/apprentissage.ts` |
| 2026-10-12 | Import de 1 530 mots et phrases du fichier de l'utilisateur (1 739 entrées, doublons retirés) en 23 nouveaux thèmes et 7 thèmes existants, arabe écrit par Claude, explication et exemple pour chacun ; voix Jamal (Azure Speech, par l'Action) pour tous les mots et exemples, MP3 gardés sur le téléphone à la première écoute | `src/data/*.json`, `src/data/themes.ts`, `scripts/generate_audio.py`, `vite.config.ts` |
| 2026-10-13 | Onglet Quiz : quiz de 5 questions, Quiz express (60 s, record) et Chasse aux sons ; Distingue les sons (14 paires comme 9elb / kelb, voix Jamal) dans les sessions et les quiz | `src/features/quiz/`, `src/exercices/quiz.ts`, `src/data/sons/paires.json`, `src/data/pairesSons.ts`, `src/features/session/Distingue.tsx` |
| 2026-10-13 | Mode écoute mains libres ; favoris, mots difficiles et « Signaler une erreur » avec liste à envoyer (base v4) | `src/features/ecoute/`, `src/audio/lecteur.ts`, `src/db/marques.ts`, `src/exercices/selections.ts`, `src/features/apprendre/ListeSpeciale.tsx`, `src/features/profil/MotsSignales.tsx` |
| 2026-10-13 | Jeu (jalon 4) : quêtes du jour et théière, semaine de la série, collection bronze / argent / or, 12 badges ; Parcours en voyage au Maroc (10 étapes, leçons, passeport, trésors) ; dirhams et souk de décor, plante qui pousse avec le niveau ; mini-jeux marchandage et taxi ; rappel .ics et sauvegarde ; bases v5 et v6 | `src/gamification/`, `src/features/jeu/`, `src/features/parcours/`, `src/db/journal.ts`, `src/db/souk.ts`, `src/db/sauvegarde.ts`, `src/sauvegarde/`, `src/exercices/jeux.ts`, `src/features/quiz/Marchandage.tsx`, `src/features/quiz/Taxi.tsx` |
| 2026-10-13 | Dis-le (jalon 3) : enregistrement, score sur 100 par MFCC + DTW contre la voix Jamal, étoiles, « Le score se trompe », auto-évaluation sans micro ; dans les sessions, leçons et quiz ; réglage du score sur la voix et interrupteur Micro dans Profil | `src/scoring/`, `src/audio/micro.ts`, `src/features/session/DisLe.tsx`, `src/features/profil/ReglageVoix.tsx` |
| 2026-10-13 | « Mon jardin » (plante en grand qui grandit avec l'XP, 6 espèces, décors et objets ; troisième choix du menu de Progrès ; animation de croissance à l'ouverture, dans le bilan et quand la théière arrose la plante), dirhams selon la précision, souk en deux allées avec de quoi décorer le jardin et l'appli (couleurs, sons, confettis, zelliges) | `src/features/jeu/Plante.tsx`, `src/features/jeu/MonJardin.tsx`, `src/features/jeu/Souk.tsx`, `src/gamification/jardin.ts`, `src/gamification/souk.ts`, `src/audio/effets.ts` |
| 2026-10-13 | Parler : Construis la phrase et Dis-le en darija dans les sessions (score adapté aux phrases) ; Grammaire orale (6 fiches, 50 phrases à écouter, entraînement de 5 questions) ; 8 dialogues à écouter puis à jouer, accordés au genre (réglage dans Profil) | `src/exercices/phrases.ts`, `src/exercices/grammaire.ts`, `src/exercices/dialogues.ts`, `src/features/session/Construis.tsx`, `src/features/session/DisLe.tsx`, `src/features/parler/`, `src/data/parler/` |
| 2026-10-13 | Page « Mes mots » : bouton « Ouvrir l'application », heure de l'ajout envoyée avec le mot et affichée à la réception | `src/features/ajout/`, `src/data/motsPerso.ts`, `src/db/motsPerso.ts`, `src/app/App.tsx` |
| 2026-10-13 | Souk : aperçu des articles de « L'appli » (couleur, sons, confettis, zellige) avant l'achat, retiré si on n'achète pas | `src/features/jeu/Souk.tsx`, `src/features/session/Bilan.tsx`, `src/ui/Alerte.tsx` |
| 2026-10-12 | Animation d'ouverture : vidéo de 3 s de l'utilisateur sur fond sombre à chaque lancement, passée d'un toucher, image finale avec Réduire les animations ou si la vidéo ne démarre pas | `public/lancement.mp4`, `public/lancement-fin.jpg`, `src/app/lancement.ts`, `index.html` |

## Décisions

- 2026-10-11 : appli 100 % locale publiée sur GitHub Pages (pas de serveur ni de compte), repo public pour que Pages soit gratuit (aucune donnée personnelle dans le repo hors demandes de l'utilisateur) ; publication et MP3 par GitHub Actions, pour que tout se fasse sans ordinateur (l'utilisateur n'utilise que son iPhone).
- 2026-10-11 : score par comparaison acoustique MFCC + DTW sur l'appareil (hors ligne, la voix reste privée) ; rappel quotidien par fichier .ics (une notification push exigerait un serveur) ; pas de routeur, navigation par état React (2026-10-10). Listes de mots affichées par tranches (60, puis 120 à l'approche du bas, `IntersectionObserver`) au lieu des 1 682 lignes d'un coup.
- 2026-10-10 : l'écriture arabe s'affiche par défaut à côté du latin (demande de l'utilisateur), masquable dans Profil ; champ `prononciation` obligatoire et `exemple.arabe` ajoutés au format des mots, pour l'explication affichée et pour la synthèse de l'exemple.
- 2026-10-10 : les 8 thèmes (152 mots) sont écrits dès le jalon 1 (demande de l'utilisateur). Sans MP3, l'appli lit l'écriture arabe avec la synthèse vocale du téléphone (voix arabe) ; la liste des MP3 présents est fixée au build (`__AUDIOS__` dans `vite.config.ts`).
- 2026-10-12 : design d'Apple en PWA (demandes de l'utilisateur) : Liquid Glass en CSS (deux couches `backdrop-filter` en pseudo-éléments, liseré et dispersion en ombres internes, Pointer Events, sans bibliothèque ; Safari n'accepte pas de filtre SVG dans `backdrop-filter`, donc pas de vraie réfraction, et `glassEffect` de SwiftUI ne vaut que pour les applis natives), réservé aux commandes ; fond système gris, listes groupées, grands titres ; retour réduit à un chevron dans un rond en verre (nom de la page précédente gardé pour VoiceOver) ; bord de défilement flou ; icônes Lucide (licence des SF Symbols réservée aux applis Apple) ; animations coupées avec « Réduire les animations » ; alertes de l'appli (`Alerte`, rendu dans `document.body`) au lieu de `window.confirm`, impossible à styler. Couleurs principales du drapeau marocain (demande de l'utilisateur), à la place de l'orange ; erreurs en rouge et réussites en vert restent lisibles car toujours accompagnées d'une icône (croix, coche).
- 2026-10-12 : la session du jour remplace les « 5 cartes du jour » du cahier des charges ; Dis-le et Distingue les sons y sont entrés au jalon 3.
- 2026-10-12 : nouveaux mots illimités (demande de l'utilisateur) : 5 par session, autant de sessions que voulu, sans cœurs ni blocage ; les réponses ne sont enregistrées qu'en fin de session ; quitter en cours de route ne change rien, pour garder la répétition espacée cohérente.
- 2026-10-12 : la série est calculée à partir de l'historique des sessions (table `sessions`), sans compteur stocké, pour qu'elle ne puisse pas se désynchroniser ; sons de retour synthétisés par Web Audio, sans fichier.
- 2026-10-12 : réglage d'apparence stocké dans le profil Dexie (`apparence`), copié dans localStorage uniquement pour l'appliquer avant le premier affichage (sans flash) ; Dexie reste la référence. De même, « Ne plus afficher » de l'aide à l'installation va dans le profil (`masquerAideInstallation`, sans migration) ; l'aide attend la lecture du profil pour ne pas clignoter.
- 2026-10-12 : import du fichier de 1 739 entrées (demande de l'utilisateur) : les 130 mots déjà présents (même latin ou variante, comme mr7ba/mar7ba) gardent leur version et leur progression ; doublons du fichier fusionnés (sens réunis par « / ») ; thèmes recoupant un thème existant fusionnés, les autres en 23 thèmes ajoutés ; niveau 1, 2 ou 3 selon le numéro du thème (1-10, 11-21, 22-31) ; latin corrigé seulement quand il contredisait l'arabe (sahb → sa7b, qbel → 9bel…), ṭ, ṣ, ə remplacés par t, s, e.
- 2026-10-12 : retour à de vrais MP3, voix Jamal par l'API officielle Azure Speech (demande de l'utilisateur, qui a créé le compte et les secrets) : edge-tts était bloqué (403) et les voix iPhone / mms lisent de l'arabe standard. Écart assumé à « aucune clé d'API » : la clé ne sert que dans l'Action, jamais dans l'appli ni le repo. Offre F0 : 500 000 caractères par mois (le programme en pèse 13 000) et 20 requêtes par minute, d'où un fichier toutes les 3,2 s et une première génération d'environ 1h30 ; l'Action est prévue pour reprendre où elle s'est arrêtée.
- 2026-10-12 : MP3 hors du précache de la PWA (cache à l'exécution `CacheFirst` avec `rangeRequests`, indispensable à Safari pour lire l'audio depuis le cache) : le premier chargement reste léger, chaque mot écouté une fois marche ensuite hors ligne. Un mot jamais écouté hors ligne retombe sur la voix de l'iPhone.
- 2026-10-12 : l'appli s'appelle « Darijaapp » (demande de l'utilisateur) : nom du manifeste, nom sous l'icône (`apple-mobile-web-app-title`) et titre de la page. L'adresse reste …/Darijapp/ (nom du repo).
- 2026-10-12 : « Mes mots » n'est joignable que par `#ajout` (hash lu dans `App.tsx`, sans routeur) : caché, pas protégé (repo public) ; mots ajoutés aux trois champs obligatoires, lus par la synthèse vocale, placés avant le programme dans `tousLesMots()` (le programme reste `MOTS`, JSON statique ; la logique et les écrans lisent `tousLesMots()` / `useMots()`) ; les mots d'une autre personne arrivent par un lien partagé (feuille de partage iOS) qui contient le mot, rien n'étant stocké en ligne : un jeton GitHub serait public, un serveur contredirait le 100 % local ; ajout après confirmation et validation de la translittération.
- 2026-10-12 : angles continus d'Apple par `corner-shape: superellipse(1.5)` sous `@supports` (Chrome ; Safari garde des arcs aux mêmes rayons), sans `clip-path` ni `mask` qui casseraient le flou du verre ; rayons concentriques en `calc(px + rem)` (Dynamic Type) ; marges et hauteurs de liste en px fixes (`--spacing-marge` 20 px, `--spacing-ligne` 56 px) copiées d'une capture des Réglages, car 1 rem = 17 px dans l'appli.
- 2026-10-12 : animation d'ouverture = la vidéo de l'utilisateur telle quelle (demande de l'utilisateur, nom complet visible accepté dans le repo public) ; voile sombre écrit dans `index.html` pour éviter un flash blanc avant le JS ; vidéo précachée et lue depuis un blob, car Safari la demande par requêtes Range que le précache de la PWA ne sert pas.
- 2026-10-12 : génération audio et mise en ligne séparées en deux Actions : une génération de 1h30 bloquait la publication de tout changement de code (et l'exécution suivante, partie d'un commit sans les MP3, aurait tout regénéré).
- 2026-10-13 : le Quiz contrôle sans réviser : il n'écrit pas dans la répétition espacée (des mots jamais vus peuvent le compléter) mais compte pour l'XP et la série ; il se compte par question, les paires justes seulement sans aucune erreur. Record du Quiz express dans le profil (`recordExpress`, champ non indexé, sans migration). De même, les mots des paires de sons sont à part du programme (fichier hors des thèmes, ids `son-…`) et ne passent jamais par la répétition espacée (`Resultats.compter`) : ce sont des exemples d'écoute ; record de la Chasse aux sons dans le profil (`recordSons`).
- 2026-10-13 : mode écoute avec l'écran gardé allumé (Wake Lock) plutôt qu'en arrière-plan : la synthèse vocale de l'iPhone (voix de secours et français) s'arrête quand l'écran se verrouille. Favoris et signalements dans une table à part (`marques`, v4) et non dans la progression : marquer un mot jamais vu l'aurait compté comme vu et retiré des nouveaux mots.
- 2026-10-13 : exemples des mots importés écrits pour tous les 1 530 (choix de l'utilisateur), une phrase courte et courante par mot ; l'article d'un mot en ش n'est pas doublé en latin (chta = الشتا), sinon le test de translittération compterait deux « ch ».
- 2026-10-13 : quêtes, semaine, collection et badges calculés à partir des tables existantes (activités, progression, profil), sans état stocké qui pourrait se désynchroniser ; seuls les mots écoutés et l'ouverture de la théière vont dans `journal`, et l'XP de la théière dans `bonus` (pas dans `sessions`, pour ne pas fausser les activités du jour). Badges de série sur le record (plus longue suite de jours), pour qu'un badge obtenu ne se perde pas. Parcours indépendant du programme de la session du jour (qui garde l'ordre des thèmes) : les leçons d'étape écrivent dans la même répétition espacée ; aucune étape n'est verrouillée, seuls les trésors attendent un tampon.
- 2026-10-13 : score de prononciation écrit à la main (FFT, banc mel, DCT, DTW, ~300 lignes testées) plutôt qu'avec Meyda : rien à télécharger, et le même code tourne dans les tests Node et dans Safari. Une seule voix de référence (Jamal) : la voix de l'utilisateur est compensée par les étirements de fréquence et par le réglage sur 4 mots faciles, car sans eux une autre voix est presque aussi loin du bon mot que d'un mot voisin (essai avec espeak-ng). Le calibrage du cahier des charges (« deux rendus de synthèse ») se fait sur des rendus fabriqués par ffmpeg, Azure n'étant pas joignable depuis Claude Code et Jamal donnant toujours le même rendu.
- 2026-10-13 : Dis-le compte dans la répétition espacée (règle des 60) mais n'est pas refait en fin de session : on peut réessayer sur place, et le résultat n'est validé qu'au « Continuer ». Le Profil garde des distances, jamais la voix ; l'essai n'existe qu'en mémoire, le temps de le réécouter.
- 2026-10-13 : voix gardée telle quelle (Jamal lit l'arabe sans voyelles), au choix de l'utilisateur après écoute : un essai où la voix lisait le latin réécrit en arabe vocalisé (soukoun, chadda, voyelles du latin, consonnes lourdes prises à l'arabe), pour un accent moins littéraire, prononçait mal certaines lettres ; essai retiré (il reste dans l'historique git, commits du 2026-10-13 « la voix lit le latin »). Débit inchangé (refusé).
- 2026-10-13 : la page « Mes mots » a un bouton « Ouvrir l'application » (demande de l'utilisateur) : la personne qui ajoute des mots peut aussi découvrir l'appli, avec sa propre progression sur son téléphone ; le bouton vide le hash comme la sortie d'un lien `#mot=`, sans rechargement. Demande d'être prévenu, avec l'heure et le lieu, quand quelqu'un ouvre `#ajout` : impossible sans serveur ni service externe (principe du 100 % local), et une localisation cachée serait de la surveillance ; à la place (choix de l'utilisateur), l'heure de l'ajout voyage dans le lien du mot, et la personne en est avertie ; le champ « Lieu » facultatif, d'abord ajouté, a été retiré à la demande de l'utilisateur.
- 2026-10-13 : dirhams jamais stockés, recalculés depuis l'historique (bonnes réponses et bonus de précision par activité, théières, trésors) moins les achats : le solde ne peut ni se désynchroniser ni devenir négatif, et les activités d'avant le bonus en profitent aussi ; souk limité au décor pour respecter « rien de payant ni de verrouillé ». Plante et décors dessinés en SVG dans le code (rien à télécharger, net à toute taille), dont la croissance se règle par un avancement continu, ce qui permet de l'animer image par image (`useCroissanceAnimee`, étapes calculées par `etapesDeCroissance`) ; l'XP avant chaque activité est rendue par `enregistrerSession` / `enregistrerActivite` (`xpAvant`) pour le bilan ; sons du souk synthétisés par Web Audio comme les sons de départ ; pas d'icône d'appli à changer : iOS ne le permet pas à une appli web.
- 2026-10-13 : « Construis la phrase » reprend les 1 682 exemples existants (MP3 déjà là, rien à écrire) et « Dis-le en darija » réutilise Dis-le en mode inverse, seulement sur des mots en boîte 2 ou plus pour qu'il reste faisable ; tous deux s'ajoutent par une option de `composerSession` (`phrase`, `connus`), sans changer les sessions existantes ni le Quiz.
- 2026-10-13 : la grammaire réutilise le moteur de session : chaque forme devient un mot (thème `grammaire-<leçon>` pour que les leurres viennent de la leçon, et son propre exemple pour « Construis la phrase »), et `Session` prend `activite` (`quiz` ou `grammaire`) à la place de `quiz`. 6e fiche sur les questions (wach, fin, chno…) plutôt que kayn / ma kaynch, déjà dans la fiche sur la négation. Genre masculin par défaut tant qu'il n'est pas choisi. Dialogues : chaque réplique de l'utilisateur est un Dis-le inverse (français seul) noté contre le MP3 de la réplique, comme une phrase ; version au féminin seulement sur les répliques qui changent (`feminin`, MP3 à part) plutôt que deux scènes ; meilleur résultat dans le profil (champ non indexé, sans migration).

## Points en suspens

- Voix : MP3 Jamal générés par l'Action « Audio » (secrets `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION`) ; si Azure refuse (401/403), vérifier la clé, la région et le niveau F0. Tant qu'un MP3 manque, la voix de l'iPhone lit (arabe standard). La voix reste un peu « littéraire » (arabe standard) : pour un mot qui sonne mal, corriger son champ `arabe` (orthographe darija) et supprimer son MP3.
- Score de prononciation : calibré sur des rendus de la voix Jamal et vérifié dans Chromium avec un faux micro (même mot plus aigu : 85 ; autre mot : 13), jamais avec une vraie voix humaine ni sur iPhone. À éprouver : faire le réglage dans Profil, puis noter les scores de mots bien et mal dits ; ajuster `BAREME` et `DISTANCE_DE_REGLAGE` (`src/scoring/score.ts`) si besoin. Envisagé : seconde référence avec la voix Mouna (`ar-MA-MounaNeural`), meilleure des deux notes ; quête « 3 mots notés 80 ou plus ». Pas de score pour les mots ajoutés (pas de MP3) : auto-évaluation. Le score des phrases (grammaire, dialogues) est calibré sur des rendus de Jamal, pas encore sur une vraie voix : à éprouver aussi.
- Contenu relu par Claude (cohérence latin/arabe), jamais par un locuteur natif : l'arabe, les explications et les exemples des 1 530 mots importés sont de Claude ; signaler les erreurs depuis la fiche mot. Les 1 530 MP3 d'exemple sont générés par l'Action « Audio » (environ 1h20). Les 50 phrases de grammaire et les 8 dialogues sont aussi de Claude, sans relecture native (leurs 106 MP3 sont générés).
- Mode écoute : vérifier sur iPhone que la lecture continue écran allumé, et si les commandes de l'écran verrouillé apparaissent. Le Dictionnaire montre tous les mots, avec une pastille bronze, argent ou or sur ceux déjà vus (le cahier des charges ne prévoyait que les mots vus).
- Sur iPhone, l'appli installée et Safari ont chacun leur mémoire (non vérifié) : un lien `#mot=…` ouvert dans Safari ajoute sans doute le mot à Safari ; contournement : Profil > Exporter dans Safari, puis Importer dans l'appli.

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
