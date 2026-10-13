# Cahier des charges — Application d'apprentissage du darija marocain

10 octobre 2026

## Contexte et objectifs

L'application doit permettre d'apprendre 300 mots et expressions de darija marocain en 3 mois, à l'oral d'abord, par sessions ludiques de 5 à 10 minutes par jour. Le darija se parle bien plus qu'il ne s'écrit et n'a pas d'orthographe standard : l'écoute et la répétition sont donc au centre, l'écrit sert seulement de support.

Objectifs :

- Comprendre et prononcer les mots du quotidien : salutations, chiffres, nourriture, transports, marché.
- Maîtriser les sons absents du français : ع (3), ح (7), ق (9), خ (kh), غ (gh).
- Tenir une pratique quotidienne courte, avec une progression visible.

Les chiffres (300 mots, 3 mois) sont des cibles de départ, à ajuster après le premier mois d'utilisation.

## Utilisateur cible et périmètre

La version 1 vise un seul profil : un francophone débutant, sans connaissance de l'alphabet arabe, qui apprend pour lui-même. C'est un outil personnel, entièrement construit avec Claude Code : pas de serveur, de compte ni de service externe.

| Domaine | v1 | Évolutions |
| --- | --- | --- |
| Vocabulaire | 1 682 mots et phrases en 31 thèmes (tous avec voix marocaine, explication de prononciation et exemple ; 1 530 importés d'un fichier fourni par l'utilisateur, dont Claude a écrit l'arabe et les exemples), plus tes propres mots | Relecture par un locuteur natif, exemples pour les mots importés |
| Audio | Synthèse vocale générée par script, remplaçable par tes enregistrements | Dialogues audio |
| Prononciation | Score sur 100 calculé sur l'appareil, paires de sons proches | Notation de phrases entières |
| Jeux | Cartes du jour, quiz, parcours, quêtes, séries, niveaux | Leçons de grammaire, dialogues, défis chronométrés |

Hors périmètre de la v1 : grammaire détaillée, apprentissage de l'écriture arabe, fonctions sociales (invitations, classements).

## Écrans et navigation

L'appli s'organise en 5 onglets dans une barre de navigation basse et suit les règles de design d'Apple (iOS 26) : grand titre par écran, listes groupées, couleurs et typographie système, Liquid Glass réservé aux barres et commandes. Le niveau, l'XP et la série s'affichent sur l'accueil et dans Progrès. Toutes les leçons restent ouvertes : le Parcours met simplement en avant la prochaine leçon conseillée.

| Onglet | Rôle | Fonctionnalités |
| --- | --- | --- |
| Apprendre | La session du jour (écran d'accueil) | Session façon Duolingo : révisions dues et 5 nouveaux mots, présentés puis exercés (Écoute et choisis, Traduis, Associe les paires), barre de progression, retour immédiat, questions ratées refaites en fin de session, bilan avec XP et série ; « Encore une session » sans limite de mots ; en dessous, le guide des sons et les thèmes |
| Parcours | La progression guidée | Voyage au Maroc en 10 étapes (villes) qui regroupent les 31 thèmes ; prochaine étape conseillée mise en avant ; leçon d'étape ; tampon dans un passeport quand 80 % des mots de l'étape sont retenus ; trésors à +100 XP entre les étapes |
| Quiz | Le contrôle des acquis | Quiz de 5 questions mêlant les exercices, sans toucher aux révisions ; Quiz express (60 s, record) ; Chasse aux sons (60 s de « Distingue les sons », combo dès 5 bonnes réponses d'affilée, record) ; mini-jeux Marchandage au souk (comprendre les prix, faire baisser) et Le taxi (suivre les directions en darija) ; bonus de quête si aucune faute |
| Progrès | Le tableau de bord | Accueil « Salut + prénom » ; niveau, XP total, XP du jour et XP restants avant le niveau suivant ; quêtes du jour et coffre ; série avec calendrier de la semaine ; statistiques (mots maîtrisés par thème, taux de réussite, courbe du score par son) ; bascule vers le Dictionnaire |
| Profil | Les réglages | Prénom et avatar ; genre, pour accorder les phrases (« toi » se dit nta au masculin, nti au féminin) ; objectif quotidien ; heure du rappel ; vitesse audio et lecture automatique ; affichage de l'arabe ; langue de l'interface ; mode sombre ; export, import et remise à zéro de la progression |

Le Dictionnaire liste tous les mots, en marquant ceux déjà vus, avec recherche, audio et niveau de maîtrise de chaque mot.

Rappel quotidien : l'appli génère un événement récurrent au format .ics, avec une alerte à l'heure choisie (par exemple 19 h), à ajouter une fois au Calendrier de l'iPhone.

## Fonctionnalités complémentaires

Ces fonctions complètent les écrans et se codent entièrement dans l'appli.

| Fonctionnalité | Ce qu'elle fait | Où |
| --- | --- | --- |
| Premier lancement | Prénom, genre, objectif quotidien (5, 10 ou 15 min), autorisation du micro, guide d'installation sur l'écran d'accueil (Partager, puis « Sur l'écran d'accueil »), test des 5 sons clés | Premier démarrage |
| Animation d'ouverture | Vidéo de 3 s fournie par l'utilisateur (logo, « Darija », « Le marocain, à l'oral d'abord. »), puis fondu sur l'appli ; un toucher la passe ; image finale seule avec Réduire les animations | À chaque lancement, sauf sur les pages `#ajout` et `#mot=` |
| Aide à l'installation | Fenêtre qui explique comment ajouter Darijaapp à l'écran d'accueil (Partager, « Sur l'écran d'accueil », « Ajouter »), avec une case « Ne plus afficher » | À chaque ouverture dans Safari sur iPhone ou iPad, jusqu'à ce que la case soit cochée ; jamais dans l'appli installée |
| Mes mots | Ajouter un mot entendu au Maroc (latin, français, arabe facultatif), avec l'audio de la synthèse vocale du téléphone ou ton enregistrement | Dictionnaire |
| Remplacer l'audio | Enregistrer ou importer un fichier pour remplacer l'audio d'un mot, par exemple le message vocal d'un ami | Fiche mot |
| Signaler un mot | Marquer une traduction ou une translittération douteuse ; la liste s'exporte pour corriger le fichier JSON avec Claude Code | Fiche mot |
| Mots difficiles | Liste automatique des mots les plus ratés, révisables en une session dédiée | Apprendre |
| Favoris | Épingler les mots utiles pour un prochain voyage et les réviser à part | Dictionnaire |
| Mode écoute | Enchaîne mot darija, pause, traduction, pour réviser sans regarder l'écran | Apprendre |
| Rappel calendrier | Génère le fichier .ics du rappel quotidien | Profil |
| Sans micro | Interrupteur « Micro » dans Profil, ou accès au micro refusé : Dis-le devient une auto-évaluation (dire le mot à voix haute, puis « Je l'ai bien dit » ou « À retravailler ») | Partout |

## Vocabulaire et prononciation

Chaque mot est une fiche dont l'audio est l'élément principal ; le texte n'est qu'un repère.

Une fiche contient :

- le mot en lettres latines (ex. « 3afak ») et en arabe (عافاك), affiché par défaut et masquable dans les réglages ;
- la traduction française (« s'il te plaît ») ;
- l'audio à vitesse normale et ralentie (0,75×) ;
- une phrase d'exemple avec son audio ;
- une note de prononciation pour les sons difficiles ;
- son thème et son niveau (1 à 3).

Parcours de prononciation pour chaque mot :

1. Écouter le modèle, autant de fois que voulu.
2. S'enregistrer avec le micro du téléphone.
3. Réécouter sa voix juste après le modèle (mode « comparer »).
4. Recevoir un score sur 100, qui alimente la répétition espacée (détails ci-dessous).

Un mini-module « Les sons du darija » présente les 5 sons clés avec un mot exemple chacun : 3afak (ع), 7ut – poisson (ح), 9ahwa – café (ق), khobz – pain (خ), ghali – cher (غ).

### Score de prononciation

Chaque fois que l'appli te fait parler, elle affiche un score sur 100, calculé sur le téléphone en comparant ta voix à l'audio de référence du mot.

Méthode : l'appli extrait l'empreinte sonore (MFCC) de ta voix et de l'audio de référence, puis mesure leur écart avec l'algorithme DTW, qui tolère un débit plus lent ou plus rapide. Tout se calcule hors ligne et ta voix ne quitte jamais le téléphone.

Le calcul tient dans un module unique (`src/scoring/`), testé à part, pour pouvoir l'améliorer sans toucher au reste.

Affichage après chaque prise de parole :

- 80 à 100 : « Excellent », 3 étoiles ;
- 60 à 79 : « Presque », 2 étoiles, le modèle est rejoué ;
- moins de 60 : « À retravailler », 1 étoile, audio ralenti et note sur le son difficile.

Un score de 60 ou plus compte comme un mot réussi dans la répétition espacée ; un bouton « Le score se trompe » permet de corriger à la main.

Calibrage automatique : des tests comparent le MP3 de Jamal d'un mot à d'autres rendus du même mot (ralenti, voix plus aiguë, voix plus grave, fabriqués par ffmpeg, car Jamal donne toujours le même rendu), qui doivent dépasser 80, et les deux mots de chaque paire de sons proches (9elb / kelb…), qui doivent rester sous 60 ; les seuils s'ajustent sur ces tests.

Réglage sur ta voix : ta voix n'est pas celle de Jamal. Dans Profil, « Régler le score sur ma voix » te fait répéter 4 mots faciles ; l'écart mesuré décale le barème. Chaque « Le score se trompe » qui fait passer un essai en réussi affine ce réglage. Seules des distances sont gardées, jamais ta voix.

## Apprentissage ludique

Les 5 exercices ci-dessous composent les leçons du Parcours et le Quiz de 5 questions, en privilégiant les mots à revoir ; les cartes du jour restent dans l'onglet Apprendre.

| Exercice | Déroulement | Compétence travaillée |
| --- | --- | --- |
| Écoute et choisis | Un audio, 4 traductions proposées | Compréhension orale |
| Associe les paires | Relier 5 mots darija à leur traduction | Mémorisation |
| Dis-le | Voir la traduction, prononcer, obtenir un score sur 100, puis écouter le modèle | Expression orale |
| Distingue les sons | Entendre l'un de deux mots proches (ex. 9elb, cœur / kelb, chien) et dire lequel a été prononcé | Oreille pour les sons difficiles |
| Quiz express | 60 secondes pour enchaîner un maximum de bonnes réponses | Rapidité de rappel |

Répétition espacée : chaque mot a un intervalle de révision (algorithme type Leitner ou SM-2). Un mot raté revient le lendemain ; un mot réussi plusieurs fois revient après 3, 7, puis 21 jours.

Mécaniques de motivation :

- niveaux nommés comme les étapes d'une plante (Terreau, Graine, Germe, Pousse, Tige, Feuilles, Bouton, Fleur, Fruit, Arbre), avec une mascotte pot de fleurs ; progression proposée : 120 XP pour le niveau 1, 140 pour le niveau 2, puis 20 XP de plus par niveau ;
- « Mon jardin » : en touchant la barre de niveau, la plante en grand, qui grandit avec chaque XP, dans le décor choisi ;
- dirhams : 1 par bonne réponse et un bonus de précision par activité (10 sans faute, 5 avec une erreur, 2 avec deux) ; ils s'échangent au souk contre du décor seulement : plantes, fonds et objets du jardin, pots, couleurs de l'appli, sons des réponses, confettis, zelliges ;
- 3 quêtes du jour, renouvelées à minuit : écouter 5 mots, terminer une session de cartes, réussir une session ou un quiz sans faute ; une quête de prononciation peut s'y ajouter (3 mots notés 80 ou plus) ;
- coffre du jour : les 3 quêtes terminées rapportent +60 XP ;
- série de jours consécutifs avec calendrier de la semaine et mention « Série sécurisée pour aujourd'hui » ; une journée manquée par semaine ne casse pas la série ;
- points d'expérience par exercice réussi, avec le total du jour affiché ;
- trophées et nœuds « Trésor » dans le Parcours, badges d'étape (50 mots, 7 jours d'affilée, tous les sons maîtrisés) ;
- confettis à chaque quête, niveau ou série validés, et retour immédiat après chaque réponse : couleur, petit son, bonne réponse rejouée.

## Contenu

Le MVP couvrait 8 thèmes d'environ 20 mots, rédigés par Claude Code dans un fichier JSON par thème, avec leur audio généré automatiquement. S'y ajoutent 1 530 mots et phrases importés d'un fichier de 1 739 entrées fourni par l'utilisateur (français et latin), dont Claude Code a écrit l'arabe ; Claude Code a aussi écrit leur explication de prononciation et leur exemple, lus par la voix marocaine.

| Thème | Exemples |
| --- | --- |
| Salutations et politesse | salam, labas, bslama, 3afak, chokran |
| Chiffres et prix | wa7ed, joj, tlata, ch7al ? |
| Nourriture et boissons | khobz, atay, 9ahwa, lma |
| Au souk et marchandage | ghali, bezzaf, n9es chwiya |
| Transports et directions | taxi, fin ?, limen, liser |
| Se présenter et famille | smiti, mnin nta ?, mama, baba, khouya |
| Jours et moments | lyoum, ghedda, lbare7 |
| Expressions utiles | wakha, safi, inchallah, mzyan |

Convention d'écriture : lettres latines avec les chiffres utilisés par les Marocains en ligne (3 = ع, 7 = ح, 9 = ق), plus kh (خ), gh (غ) et ch (ش). Cette règle est fixée une fois et appliquée à tous les mots.

Format d'un mot dans les données :

```json
{
  "id": "politesse-004",
  "latin": "3afak",
  "arabe": "عافاك",
  "fr": "s'il te plaît",
  "theme": "politesse",
  "niveau": 1,
  "prononciation": "3a-fak : commence par le 3 (ع), un « a » serré au fond de la gorge.",
  "audio": "audio/politesse-004.mp3",
  "exemple": {
    "latin": "3tini atay 3afak",
    "arabe": "عطيني أتاي عافاك",
    "fr": "Donne-moi du thé, s'il te plaît",
    "audio": "audio/politesse-004-ex.mp3"
  }
}
```

Progression d'un mot, stockée sur le téléphone :

```json
{
  "id": "politesse-004",
  "boite": 3,
  "prochaineRevision": "2026-10-18",
  "reussites": 5,
  "echecs": 1,
  "scores": [62, 74, 81],
  "favori": false,
  "signale": false,
  "audioPerso": null
}
```

Génération de l'audio : un script Python, lancé automatiquement par GitHub Actions à chaque modification des mots, transforme l'écriture arabe de chaque mot et de chaque exemple en fichier MP3 avec la voix neuronale marocaine Jamal de Microsoft (ar-MA-JamalNeural, par l'API Azure Speech, offre gratuite). Tant qu'un MP3 manque, la voix arabe de l'iPhone lit le mot. La mise en ligne est une Action séparée, qui publie un changement en 2 minutes environ. Les fichiers sont générés une fois, rangés dans `public/audio/` et embarqués dans l'appli, qui reste hors ligne.

Cette voix a un accent marocain mais reste une synthèse : elle sert de repère, et la fonction « Remplacer l'audio » permet d'y substituer une vraie voix marocaine dès que tu en as une.

Tant qu'un MP3 n'a pas été généré, l'appli lit l'écriture arabe avec la synthèse vocale du téléphone.

Pour un mot ajouté depuis l'appli, l'audio vient de la synthèse vocale intégrée au navigateur (API Web Speech) ou de ton propre enregistrement.

Ajouter un thème revient à ajouter un fichier JSON et à relancer le script audio.

## Architecture et stack technique

La v1 est une web app entièrement locale, sans serveur ni compte : tout se construit, se teste et se publie avec Claude Code.

Tout tourne sur le téléphone, sans serveur ni compte. L'audio est préparé une fois sur l'ordinateur, puis l'appli est publiée sur GitHub Pages.

- **Sur le téléphone** (web app installée sur l'écran d'accueil, utilisable hors ligne) :
  - **Écrans** : Apprendre, Parcours, Quiz, Progrès, Profil ;
  - **Moteur d'exercices** : choisit les questions et corrige les réponses ;
  - **Répétition espacée** : calcule la prochaine révision de chaque mot ;
  - **Enregistreur et score** : micro, puis score sur 100 par rapport à la référence ;
  - **Contenu** : mots en JSON et fichiers audio MP3 ;
  - **Stockage local (IndexedDB)** : progression (dont les scores de prononciation), séries, XP, mots ajoutés ; ta voix n'est jamais gardée.
- **Outils de préparation** :
  - **Script audio (Python)** : génère les MP3 une fois avec la voix marocaine Jamal ;
  - **GitHub Pages** : sert l'appli au téléphone, publiée par Claude Code.

Les écrans pilotent le moteur d'exercices, qui puise dans le contenu et transmet chaque résultat à la répétition espacée ; tout est enregistré sur l'appareil. Le script audio et la publication tournent sur GitHub Actions, à chaque modification poussée par Claude Code : aucun ordinateur n'est nécessaire.

| Brique | Choix recommandé | Raison |
| --- | --- | --- |
| Interface | React + Vite + TypeScript | Écosystème très répandu, simple à faire évoluer |
| Style | Tailwind CSS | Mise en page mobile rapide |
| Hors ligne | PWA (vite-plugin-pwa) | Installable sur l'écran d'accueil, marche sans réseau |
| Stockage | IndexedDB via Dexie | Progression, mots ajoutés et enregistrements gardés sur l'appareil |
| Audio des mots | Script Python + voix marocaine Jamal (API Azure Speech, dans GitHub Actions), secours mms-tts-ara | MP3 générés une fois et embarqués dans l'appli, accent marocain |
| Audio des mots ajoutés | API Web Speech du navigateur | Synthèse immédiate, sans fichier à produire |
| Enregistrement | MediaRecorder | Intégré au navigateur |
| Score de prononciation | Empreintes MFCC + comparaison DTW, écrites dans l'appli (sans bibliothèque) | Calcul sur le téléphone, hors ligne, même code dans les tests |
| Rappel | Fichier .ics généré par l'appli | Rappel natif dans le Calendrier de l'iPhone |
| Tests | Vitest | Vérifier la répétition espacée, la correction et le score |
| Publication | GitHub Pages + GitHub Actions | Mise en ligne automatique à chaque modification, sans ordinateur |

## UX/UI et exigences non fonctionnelles

L'appli se pense pour un téléphone tenu d'une main, dans le métro ou en file d'attente.

Interface :

- 5 onglets en barre basse : Apprendre, Parcours, Quiz, Progrès, Profil (détail dans « Écrans et navigation ») ;
- gros boutons audio accessibles au pouce, lecture automatique à l'affichage d'un mot ;
- aucune lecture de l'arabe exigée : l'arabe est affiché par défaut à côté du latin, et se masque dans les réglages ;
- interface en français, aux couleurs du drapeau marocain (rouge et vert), avec un mode clair et un mode sombre au choix dans le Profil (ou automatique) ;
- design conforme aux Human Interface Guidelines d'Apple (couleurs sémantiques, police système et taille de texte réglable, zones tactiles de 44 pt, contrastes AA).

Exigences non fonctionnelles :

| Exigence | Cible |
| --- | --- |
| Hors ligne | Tout fonctionne sans réseau après le premier chargement |
| Rapidité | Ouverture en moins de 2 s, audio lancé en moins de 300 ms |
| Vie privée | Enregistrements de voix et progression restent sur l'appareil |
| Compatibilité | Chrome Android et Safari iOS récents |
| Accessibilité | Texte affiché pour chaque audio, contrastes lisibles |
| Sauvegarde | Export et import de la progression en un fichier |

## Planning et critères de réussite

Le MVP tient en 7 semaines à temps partiel (estimation, dont une semaine pour le score de prononciation), en 4 jalons que tu peux chacun tester sur ton téléphone.

| Jalon | Période | Contenu |
| --- | --- | --- |
| Socle | Semaine 1 | PWA, 5 onglets, script audio, 1 thème de 10 mots |
| Exercices | Semaines 2 et 3 | Cartes et quiz, répétition espacée |
| Prononciation | Semaines 4 et 5 | Enregistrement, score sur 100, sons du darija |
| Jeu et contenu | Semaines 6 et 7 | Quêtes et séries, parcours complet, 150 mots |
| Version 2 | Ensuite | Grammaire, dialogues, 500 mots |

Fin du MVP : si l'appli est utilisée 5 jours sur 7 pendant 4 semaines. Chaque jalon produit une version utilisable ; la v2 ne démarre qu'une fois l'habitude installée.

Le MVP est réussi si :

- [ ] les 150 mots sont disponibles avec leur audio généré ;
- [x] le score dépasse 80 entre deux rendus du même mot et reste sous 60 entre deux mots proches ;
- [ ] tu utilises l'appli 5 jours sur 7 pendant 4 semaines ;
- [ ] ton taux de bonnes réponses en révision dépasse 80 % ;
- [ ] aucune progression n'est perdue après fermeture ou mise à jour.

## Démarrer avec Claude Code

Avance jalon par jalon : un jalon = une session Claude Code, avec un plan validé avant d'écrire du code.

1. Installe Claude Code, crée un dossier `darija-app` et lance `claude` dedans.
2. Exporte ce cahier des charges en Markdown et place-le dans `docs/cahier-des-charges.md`.
3. Crée un fichier `CLAUDE.md` à la racine : Claude Code le relit à chaque session pour rester cohérent.
4. Lance le premier prompt ci-dessous, relis le plan proposé, puis laisse-le coder.
5. Demande-lui de publier l'appli sur GitHub Pages, ouvre-la dans Safari et ajoute-la à l'écran d'accueil.
6. Teste, fais un commit Git, puis passe au jalon suivant.

Premier prompt :

> Lis docs/cahier-des-charges.md. Réalise le jalon 1 : projet React + Vite + TypeScript en PWA avec les 5 onglets, un thème « Salutations » de 10 mots avec fiches et lecture audio, et le script qui génère cet audio. Propose d'abord ton plan et attends ma validation avant de coder.
