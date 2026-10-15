# Essais vocaux OpenAI depuis le latin

L’utilisateur a autorisé ce premier comparatif après avoir refusé la voix HADRA.
Jamal reste la voix des exercices. Aucun fichier actif, référence de score ou
fonctionnement de l’application n’est modifié.

## État du pilote

Après ajout de crédit, la relance du run `38605552834` a généré les dix MP3
réels. Vingt empreintes et dix décodages audio sont vérifiés ; la lecture,
les avis et l’export fonctionnent en Chromium mobile. Le comparatif est publié
sur main (`b8c50ee`) :
https://mcofirty.github.io/Darijapp/test-audio-openai/
La publication Pages `38639506745` a réussi en 3 min 5 s ; contrôle HTTP
des vingt MP3 et de leurs SHA-256 réussi (`preview-http-check.json`).
Jamal reste active. La prononciation n’est pas certifiée ; attendre l’avis
de l’utilisateur avant un comparatif de 50 mots.

## Modèle et mots

Modèle figé : `gpt-4o-mini-tts-2025-12-15` ; voix : `cedar` ; sortie API : MP3.
L’API est facturée séparément de ChatGPT. Elle n’est pas nécessaire à l’écoute
des fichiers générés, qui restent réutilisables hors connexion.

`scripts/openai_tts/pilot-10.json` choisit dix entrées existantes :
`3afak`, `9elb`, `khobz`, `7lib`, `ghedda`, `ch7al?`, `we99e3`, `ssba7`,
`3tchan`, `allah yjazik bikhir`.
Chaque `input` envoyé à l’API est exactement le latin actuel de l’entrée.
Aucune cible en arabe ni aide `prononciation` n’est utilisée.
`instructions.txt` demande le darija marocain et explique 3/7/9/2, kh/gh/ch,
les consonnes doublées et la lecture d’allah ; cette consigne ne garantit pas
que le modèle respecte ces sons. La voix API peut différer de celle de ChatGPT.

## Clé et lancement

Dans GitHub : dépôt → Settings → Secrets and variables → Actions →
New repository secret → **`DARIJA_TTS_KEY`**. Une clé `OPENAI_API_KEY` existante
est également acceptée. Ne jamais écrire sa valeur dans le dépôt, les logs,
un fichier de configuration ou la conversation. La facturation API doit être active.

Le workflow « Test OpenAI latin — 10 mots » sur `feat/hadra-tts` se lance à
l’intégration de ce pilote. Sans clé, il produit un diagnostic explicite et ne
publie aucune page d’écoute incomplète. Après ajout de la clé : ouvrir ce run
dans Actions puis **Re-run failed jobs**. Aucune configuration réseau cloud
supplémentaire n’est nécessaire : l’appel API se fait sur le runner GitHub.

En local, si une clé et l’accès API sont déjà configurés, Python, NumPy et ffmpeg :

```bash
python -m unittest discover -s scripts/openai_tts -p 'test_*.py'
python scripts/openai_tts/pilot.py plan
python scripts/openai_tts/pilot.py generate
python scripts/openai_tts/pilot.py review --output artifacts/openai-review
```

## Budget, contrôle et reprise

Ce pilote est limité dans le code à dix entrées et une seule voix. Aucun lot de
50 ou de 3 511, aucune variante et aucun retry payant automatique. Il s’arrête
sur une erreur API. Les requêtes dont l’issue est incertaine ne sont pas rejouées
automatiquement ; elles demandent une vérification du diagnostic avant reprise.
Le plafond est un nombre de synthèses, pas une estimation contractuelle de prix.
Les codes publics de rejet (par exemple `insufficient_quota`) sont enregistrés
sans conserver le message externe ni les en-têtes. Les refus 401/403/429
interrompent le run sans retry ; une relance ultérieure est possible après
correction de la clé ou du quota. La reprise explicite du premier ancien 429
non accepté conserve sa trace et refuse de supprimer tout audio déjà généré.

La clé de cache inclut modèle, voix, latin, instructions et paramètres. Les MP3
bruts et leurs empreintes sont conservés ; une reprise vérifie et réutilise les
fichiers intacts sans nouvel appel. Le cache GitHub peut expirer : télécharger
l’artifact de diagnostic pour conserver la bibliothèque indépendamment du cache.
Les artifacts sont gardés 30 jours. Un cache corrompu bloque au lieu de refacturer.

Les contrôles techniques vérifient le MP3 mono 24 kHz et son décodage intégral,
la durée, les silences, les valeurs non finies et la saturation avant et après
export à 64 kbit/s. Les pauses inhabituelles sont signalées, sans rognage.
Les sorties rejetées restent dans le diagnostic, sans retry de synthèse.

**Conformité technique ≠ validation linguistique.** La prononciation reste
`uncertain`, la confiance est `null`, aucun score de fidélité n’est inventé.
L’écoute des dix mots décide si un comparatif de 50 mérite d’être préparé.

## Comparatif isolé

La page est publiée à `/test-audio-openai/` avec les dix nouveaux
MP3 techniquement conformes : vingt fichiers Avant/Jamal et Après/OpenAI, deux lecteurs,
filtres, vitesse, avis locaux et export JSON. Le test identifie explicitement
la voix générée par OpenAI. Sa clé de stockage est distincte du test HADRA
et de la progression. Aucun avis du navigateur ne déclenche un déploiement.

Avant publication : lecture intégrale de `CLAUDE.md` sur main, vérification des
textes et des SHA-256 des anciens/nouveaux MP3. Seul `public/test-audio-openai/`
est ajouté avec les notes de mémoire/historique ; aucune promotion des candidats
vers `public/audio/`. Le workflow Pages existant teste et construit l’application.

Les tests utilisent des signaux sinusoïdaux **uniquement dans des dossiers
temporaires** pour vérifier le budget et la reprise. Ces fixtures ne sont ni
des MP3 OpenAI ni des échantillons à publier.

## Deuxième essai ciblé

Avis du premier pilote : six préférences OpenAI, deux Jamal (`khobz`, `ch7al?`),
deux à revoir (`we99e3`, `3tchan`), décision globale « corrections demandées ».
Le fichier correspond aux dix textes et SHA-256 publiés ; il est conservé
localement, hors dépôt public. Ses remarques ne sont pas des instructions.

`revision-2.json` précise les consignes de consonnes uniquement pour ces quatre
mots. Chaque input latin, le modèle et la voix sont inchangés. Ce sont des
propositions à écouter, pas des prononciations certifiées.

Le workflow de reprise est plafonné à quatre synthèses. Six MP3 sont importés
du premier comparatif figé à `b8c50ee`, avec contrôle des SHA-256 et décodage,
puis conservés sans réencodage ni nouvel appel. Quatre anciens essais sont
également conservés : 24 fichiers dans le comparatif. La nouvelle page filtre
les quatre propositions par défaut et permet d’écouter le premier essai.
Les avis des six mots inchangés peuvent être repris du stockage local du même
navigateur ; aucune opinion ni progression n’est envoyée au serveur.

La reprise utilise un cache distinct, réutilise ses candidats intacts et garde
les tentatives incertaines bloquées. Aucun essai de 50 ni activation dans les
exercices avant une décision suivante.

Résultat V2 : quatre nouveaux fichiers conformes, six SHA-256 conservés, lecture
des trois lecteurs vérifiée sur les vrais MP3 en Chromium mobile. Publication
Pages `38642664847` réussie. Les durées/pauses de `we99e3` et `3tchan` restent
inhabituelles ; un diagnostic Common Voice non calibré suggère encore une lecture
des chiffres de `we99e3` comme des nombres. Ce mot ne doit pas être considéré
comme corrigé. Voir `revision-2-review-queue.json` ; le diagnostic ne certifie
pas les autres mots. L’utilisateur demande désormais une écriture phonétique cachée par entrée ;
Jamal reste active pendant cet essai.


## Texte audio caché par entrée

Le latin montré à l’apprenant reste inchangé. Le générateur dispose d’un texte
séparé pour chaque mot, exemple et phrase : `scripts/openai_tts/audio-texts.json`
contient les 3 511 entrées, sans ajout à l’interface ni à la base de progression.
Ce sont des **propositions**, pas 3 511 transcriptions linguistiquement validées.
`audio_texts.py` les reconstruit depuis le catalogue ; les corrections particulières
vont dans `audio-text-overrides.json`, avec le latin source pour bloquer une exception périmée.

Exemple : `latin: "we99e3"`, `audio_text.latin_phonetic: "weqqeʿ"`,
`audio_text.consonant_symbols: "weqqeʕ"`.
Le premier profil remplace 2/3/7/9 par ʾ/ʿ/ḥ/q ; le second par ʔ/ʕ/ħ/q,
avec kh/gh/ch → x/ɣ/ʃ. Les consonnes doublées sont conservées. Les voyelles
ne sont pas devinées : **aucun des profils n’est une transcription IPA complète**.
Le modèle peut encore ignorer ces symboles ; une notation différente ne garantit
pas une meilleure prononciation.

L’audit (`arabizi-audit.json`) trouve 650 mots sur 1 682 et 1 818 textes audio sur
3 511 contenant des chiffres-sons : ce sont des risques de lecture, pas autant
d’erreurs avérées. Le lexique figé de 834 tokens provient du corpus existant,
sans prétendre à une validation native. Les nombres isolés et identifiants
comme MP3 restent des nombres ; un nouveau token alphanumérique inconnu bloque
sa proposition et rejoint la révision plutôt que de recevoir une conversion aveugle.
La confiance reste `null`, la prononciation incertaine, la certification linguistique fausse.

```bash
python scripts/openai_tts/phonetic.py --audit-output docs/openai-tts/arabizi-audit.json
python scripts/openai_tts/audio_texts.py --output scripts/openai_tts/audio-texts.json
python -m unittest discover -s scripts/openai_tts -p 'test_*.py'
```

### Essai préalable sur we99e3

`phonetic_probe.py` compare deux nouvelles lectures seulement : `weqqeʿ` et
`weqqeʕ`, même modèle/Cedar, avec l’ancien MP3 chiffré conservé par SHA-256
depuis le comparatif V2 figé à `eb84bf8`. Ni le texte d’entrée ni les nouvelles
consignes ne demandent de lire les chiffres. Plafond : **deux appels API**,
aucun retry payant ; réutilisation des fichiers intacts et arrêt sur tentative incertaine.
Les contrôles MP3 sont effectués avant et après l’export mono 24 kHz / 64 kbit/s.

Le workflow `openai-tts-phonetic.yml` prépare un test autonome à trois lecteurs
sur `/test-audio-phonetic/`, avec avis locaux et export JSON. Il lit le CLAUDE.md
complet de main avant publication, vérifie les empreintes et ne touche qu’au
nouveau dossier de test et à la mémoire du projet. Aucun remplacement des MP3
actifs, aucun lot de 50 ou de 3 511 avant un résultat convaincant et une décision suivante.


Résultat de l’essai : run `38659003919` réussi (1 min 22 s), deux MP3 réels et
ancien MP3 conservé dans main `caa427c`. Trois empreintes/décodages vérifiés ;
lecture exclusive, avis locaux, export et largeur mobile testés en Chromium.
Les deux propositions ont un avertissement de silence périphérique ; elles ne
sont pas certifiées. Le diagnostic Common Voice ne retrouve plus la séquence
de lecture numérique, mais ne confirme ni q, ni ayn, ni la gémination. Voir
`phonetic-probe-review-queue.json`. Aucun résultat n’est extrapolé aux 3 511 entrées.

Publication Pages `38659125219` réussie en 3 min 1 s. Contrôle HTTP
`38659065319` passé : page, CSS et trois SHA-256 servis conformes
(`phonetic-probe-http-check.json`). Écoute :
https://mcofirty.github.io/Darijapp/test-audio-phonetic/

Avis du 2026-10-15 reçu et rapproché du test et des deux SHA-256 :
préférence pour **Symboles consonantiques**, `weqqeʕ` (`consonant_symbols`).
Voir `phonetic-probe-feedback.json`. Ce résultat porte sur we99e3 seulement ;
il ne certifie pas la méthode sur tout le corpus et n’active aucun MP3 dans les
exercices. Le fichier original reste hors dépôt public ; aucun nouvel appel API.


## Comparatif demandé de 50 entrées

Demande explicite de l’utilisateur le 2026-10-15 : générer le test proposé après
son choix `consonant_symbols`. `pilot-50.json` fige 50 mots et expressions en
31 thèmes : les dix premiers essais, 2/3/7/9, kh/gh/ch, les consonnes doublées,
des groupes de consonnes, des emprunts et quelques expressions courantes.
Le latin affiché reste celui du programme ; seul le texte audio caché est envoyé
au moteur, sans chiffres-sons et sans arabe. Ce profil n’est pas de l’IPA complet.

Modèle et voix inchangés : `gpt-4o-mini-tts-2025-12-15` / Cedar. Le MP3
`weqqeʕ` préféré est importé depuis main `caa427c`, avec les mêmes instructions,
paramètres et SHA-256 ; il est conservé sans nouvel appel ni réencodage. Les
49 autres utilisent des consignes générales de darija et de symboles phonétiques,
avec le sens français en contexte non prononcé. Ne pas propager la consigne
spécifique « signer » aux autres entrées.

`fifty.py` orchestre cinq lots de dix via le générateur existant, dont le plafond
initial reste dix. Budget global : **49 nouvelles synthèses maximum**, pas de
variante ni retry payant. Toute tentative incertaine ou tout fichier corrompu
bloque la reprise au lieu de provoquer une nouvelle facture. Les MP3 bruts,
exports, textes, paramètres, empreintes et avertissements sont sauvegardés.
Le cache GitHub peut expirer ; les artifacts (30 jours) et les fichiers publiés
permettent de conserver la bibliothèque indépendamment du cache.

Le nouveau comparatif `/test-audio-openai-50/` contient 100 MP3 : 50 Jamal avant,
49 nouveaux OpenAI après et le candidat préféré réutilisé. Navigation, recherche,
thèmes, vitesse d’écoute, avis par mot, décision globale et export
`avis-openai-50-mots.json` restent locaux, avec un stockage distinct des essais
précédents. Aucun avis ne déclenche de déploiement automatique.

Avant publication, le script lit tout le CLAUDE.md de main, vérifie les 50 latins,
textes TTS, paramètres et 100 empreintes ; il n’écrit que le dossier du test et
la mémoire/historique. Les MP3 actifs et références de score restent inchangés.
Le workflow vérifie ensuite par HTTP la page, les ressources et les 100 MP3
exactement servis. Les contrôles de format, décodage, durée, silence et saturation
n’établissent pas la fidélité linguistique : tous les candidats restent incertains,
confiance `null`, avec file de révision et avertissements visibles.

```bash
python scripts/openai_tts/fifty.py plan
python scripts/openai_tts/fifty.py generate --baseline CHEMIN/public/test-audio-phonetic
python scripts/openai_tts/fifty.py build
```


Résultat réel du test de 50 : 49 nouveaux MP3 et le candidat préféré réutilisé,
main `b68bd13`, run `38665517802`. Cent SHA-256 et décodages locaux vérifiés ;
50 candidats conformes techniquement. Quarante-quatre portent l’avertissement
`long_edge_silence`, sans rognage automatique. La conformité ne certifie aucun
son. Le lecteur Chromium mobile (393 × 852), les deux lectures exclusives,
la vitesse, la recherche, les thèmes, les avis persistants et l’export des
50 entrées sont vérifiés sur les vrais MP3 (`fifty-local-check.json`).
Le code applicatif, `public/audio/` et les références de score sont inchangés.

Publication Pages `38665785482` réussie en 3 min 29 s ; workflow de génération
et vérification `38665517802` réussi en 6 min 48 s. Contrôle HTTP complet passé :
manifest courant, page, CSS/JS et les cent SHA-256 des MP3 effectivement servis
(`fifty-status.json`). Comparatif prêt :
https://mcofirty.github.io/Darijapp/test-audio-openai-50/


### Avis partiel sur les 50 entrées

Fichier reçu le 2026-10-15 : review_id, modèle et les 50 identifiants, latins,
textes TTS, profils et empreintes correspondent exactement au comparatif.
Décision globale `pending` : **24 votes renseignés, 26 sans vote**.
Vingt préférences OpenAI, trois Jamal (`ch7al?`, `3tchan`, `ach?`) et une entrée
à revoir (`allah yjazik bikhir`). Sept préférences OpenAI comportent des réserves :
six sur le débit/naturel et une sur un accent anglais. Ne pas les transformer
en sept validations sans réserve. L’incertitude sur `ttabi3a` reste sans vote.
Voir `fifty-feedback.json` ; le fichier brut et ses commentaires restent hors dépôt public.

Les symboles peuvent aider la lecture des consonnes sans imposer un accent ou
une prosodie au modèle. Un réglage de vitesse ou un retrait de silence ne garantit
pas la correction d’un accent. La suite recommandée porte sur ces problèmes
ciblés, en conservant les autres candidats et la voix Jamal des exercices.
Aucune nouvelle synthèse, certification linguistique ou activation n’est déduite
de cet avis partiel.


## Vérification réelle du candidat Astra

L’utilisateur demande explicitement des essais audio avec Astra. Le SDK ne le
référençant pas parmi les moteurs TTS/Realtime consultés, `astra_probe.py`
commence par une requête de métadonnées `/v1/models/gpt-6-astra`, puis essaie au
plus **deux POST** sur un seul mot : `/v1/audio/speech`, puis
`/v1/chat/completions` avec sortie audio explicite si la première interface
refuse définitivement la requête. Le modèle reste exactement `gpt-6-astra`,
Cedar demandée, input `weqqeʕ` ; aucun autre modèle n’est substitué.

Pas de retry après délai dépassé, réponse acceptée ou issue incertaine. Une
relance conserve le résultat du diagnostic au lieu de répéter les appels.
Les erreurs ne conservent que statut, code autorisé, paramètre et indicateurs
de limitation ; ni corps/messages externes, ni en-têtes, ni clé ne sont publiés.
Un audio réel éventuel est conservé hors public et contrôlé techniquement ;
un comparatif plus large ne sera préparé que si la sortie fonctionne.
Un refus d’API ne mesure pas la qualité de l’accent et ne prouve pas l’absence
d’Astra dans toutes les offres OpenAI. Jamal reste active.
