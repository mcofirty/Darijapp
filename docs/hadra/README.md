# HADRA : génération expérimentale depuis le latin

Cette intégration utilise `Jip7e/habibi-tts-doda-darija` à la révision
`0f9beec11b1185934e0da95c0e298f1b0457eef4`, avec F5-TTS 1.1.22 et Vocos 24 kHz
à la révision `0feb3fdd929bcd6649e0e7c5a688cf7dd012ef21`.
Les métadonnées publiques et empreintes sont conservées dans `model-inspection.json`.
Le fichier EMA inspecté pèse 674 403 089 octets ; ne pas télécharger le checkpoint d'entraînement.

## Entrée et voix

La cible est exclusivement le champ **latin** actuel du dépôt. `2`, `3`, `7`, `9`,
les digrammes et les consonnes doublées ne sont ni effacés ni remplacés par l'arabe.
Le vocabulaire HADRA contient ces caractères, mais sa carte décrit une synthèse depuis
l'arabe : sa justesse sur l'Arabizi doit être évaluée, elle n'est pas établie par ce vocabulaire.

Le conditionnement utilise le MP3 synthétique Jamal déjà présent `audio/dia-taxi-1.mp3`
(4,68 s) et le latin associé. Aucun enregistrement humain, secret Azure ou service payant
n'est nécessaire. L'alignement exact entre ce latin et la réalisation Jamal n'est pas
certifié ; cette référence est un choix initial explicite et versionné par son hash.
Le vocodeur et les poids sont vérifiés par taille et SHA-256 LFS ou empreinte Git.
Le chargement ne demande aucun `trust_remote_code` et ne lit pas `model_last.pt`.

## Installation et commandes

Depuis la racine du dépôt, Python 3.12 et ffmpeg :

```bash
python -m venv .venv-hadra
.venv-hadra/bin/python -m pip install torch==2.8.0 torchaudio==2.8.0 torchcodec==0.7.0 --index-url https://download.pytorch.org/whl/cpu
.venv-hadra/bin/python -m pip install -r scripts/hadra/requirements.txt
.venv-hadra/bin/python -m unittest discover -s scripts/hadra -p 'test_*.py'
.venv-hadra/bin/python scripts/hadra/generate.py plan
.venv-hadra/bin/python scripts/hadra/generate.py generate --ids salutations-012,nourriture-001,son-9elb --limit 3 --steps 8
```

Pour le pilote complet : `generate --limit 50 --steps 16 --variants 3`.
Les variantes ne concernent que les 15 entrées complexes. Le plafond est 80 candidats
pour HADRA seul ; aucune génération massive n'est disponible par défaut.
Le manifeste comporte noms de lettres, segments contextualisés, syllabes, mots et phrases.
Les segments contextualisés restent des syllabes complètes : aucune extraction de
« phonème isolé » ou validation IPA n'est prétendue.

Pour un GPU disponible : installer les mêmes versions depuis l'index PyTorch CUDA
adapté à la machine et passer `--device cuda`. Une demande CUDA échoue si le GPU
n'est pas disponible ; elle ne bascule pas silencieusement en CPU.

## Résultats, contrôles et reprise

Les résultats vont dans `artifacts/hadra/`, hors de `public/` : masters WAV float natifs,
MP3 mono 24 kHz/64 kbit/s, plan, rapports individuels, checksums et file de révision.
Les WAV conservent les dépassements éventuels pour diagnostic ; les signaux saturés,
muets, non finis ou de durée invalide sont rejetés techniquement. Durée attendue,
silence de bord et pauses longues produisent aussi des avertissements. Aucun silence
n'est supprimé automatiquement, pour ne pas couper des fricatives.
Les MP3 sont décodés intégralement après export et leurs flux/format sont contrôlés.

L'empreinte de tâche inclut latin exact, normalisation, modèle, vocodeur, référence
et paramètres/graine. Un master inchangé et intact est réutilisé ; un changement de
texte, voix ou modèle invalide sa clé. Les contrôles et l'export sont réexécutés sur
les masters réutilisés, sans nouvelle synthèse. Après interruption, les rapports
déjà écrits permettent de reprendre. Une graine ou variante nouvelle produit une
nouvelle candidature sans écraser la précédente.

**Conformité technique ≠ validation linguistique.** Tous les candidats portent
`pronunciation_status=uncertain`, `confidence=null` et entrent dans une file de révision.
La confiance n'est pas inventée sans évaluateur crédible du latin/son. Il n'existe
actuellement ni ASR darija de contrôle intégré ni promotion automatique vers les exercices.
Le test de présence des caractères ne prouve pas que `3` est réalisé /ʕ/ plutôt que comme
un nombre. Une incertitude persistante peut nécessiter une adaptation du modèle au latin.

## GitHub Actions et application

« Audio HADRA (pilote) » teste puis synthétise trois mots sur la branche de travail.
Après le premier essai à 8 étapes, l'essai automatique utilise 32 étapes et deux
graines pour les mots complexes (cinq candidats pour ces trois mots).
Une exécution manuelle peut sélectionner 1–50 entrées. CPU : runner hébergé standard.
GPU : runner **déjà enregistré** avec les labels `self-hosted`, `linux`, `gpu` ; aucun
service GPU n'est provisionné ni facturé par cette intégration.
Les poids et les masters intacts sont mis en cache entre exécutions ; les rapports et audios sont des artifacts conservés 14 jours.
Le cache Actions peut être évincé : il accélère la reprise mais n'est pas une archive
permanente des masters. Les MP3 de contrôle restent versionnés sur la branche.
La branche de travail conserve aussi les sons de contrôle dans `docs/hadra/probe/`.

La bibliothèque actuellement servie, l'Action Azure « Audio », les lecteurs, les caches
hors ligne et les scores existants restent actifs. Le pilote HADRA ne pousse aucun fichier
dans `public/audio` et ne déclenche pas Pages. Avant activation d'une nouvelle voix,
il faut évaluer le pilote, sélectionner les candidats, recalculer les références du
score et prévoir l'invalidation du cache audio ; une conversion de format ne suffit pas.

La carte du modèle annonce Apache-2.0. Ses affirmations de qualité et de corpus
d'entraînement sont celles de l'auteur, pas des mesures réalisées ici. Les droits du
vocodeur, du corpus et des références restent à respecter séparément.

## Essai CPU mesuré et diagnostic

L'Action [38577195775](https://github.com/mcofirty/Darijapp/actions/runs/38577195775)
a réellement synthétisé `9elb`, `khobz`, `3afak` à 8 étapes : 20,4–21,9 s de calcul
par fichier, durées 1,06–1,32 s, RTF 16,4–19,3. Les trois MP3 passent les contrôles
techniques, avec 0,51–0,59 s de silence initial signalé. C'est un essai de fonctionnement.

`probe/diagnostic-8steps.json` contient un diagnostic du modèle Common Voice XLSR
déjà utilisé dans l'application. Il signale des écarts sur q/x/ʕ ; il se trompe aussi
sur certains sons chez Jamal, notamment ʕ. Ses scores GOP non calibrés ne sont ni une
probabilité de justesse darija ni une certification ; aucun candidat n'est promu.
Pour le reproduire, avec les dépendances npm, le modèle ONNX existant et ffmpeg :

```bash
npx tsx scripts/hadra/evaluate_probe.ts artifacts/hadra/phonetic-diagnostic.json
```

Prévoir initialement 4–8 Gio de RAM CPU et 5–10 Gio de disque (dépendances, poids,
cache et masters), à confirmer par `probe/resources.txt`. Pour GPU, commencer par
un worker existant de 8–16 Gio VRAM, batch 1 ; aucune mesure GPU n'a été réalisée.
Le RTF observé sur des mots courts n'est pas une estimation fiable pour les phrases ;
le pilote doit préciser ces écarts avant tout lot complet.

L'Action [38578065237](https://github.com/mcofirty/Darijapp/actions/runs/38578065237)
a ensuite produit cinq candidats à **32 étapes**, avec deux graines pour `9elb` et
`khobz`. Contrôles techniques : cinq conformes. Synthèse : 91–99 s par fichier court,
RTF 74–87 ; génération complète 8 min 13 s, pic mémoire 2,63 Gio sur deux threads CPU.
Mesures originales : `probe/benchmark-32steps.resources.txt` ; diagnostic :
`probe/diagnostic-32steps.json`. Les écarts détectés sur les consonnes ciblées
persistent : augmenter le nombre d'étapes n'a pas établi une lecture fiable du latin.

**Conclusion du prétest : générateur opérationnel, compatibilité linguistique Arabizi
non validée.** Les huit fichiers sont des candidats expérimentaux, jamais des références
certifiées. Une adaptation au latin ou un checkpoint qui connaît cette convention doit
être évalué avant activation ; les cibles ne sont pas réécrites en arabe. Le protocole
de 50 entrées reste disponible, mais aucun lot complet ou massif n'a été exécuté.
L'Action borne la génération à 30 min pour garder du temps de sauvegarde ; fractionner
les futurs lots selon les mesures, après résolution de la lecture latine.
