# Test vocal OpenAI : dix mots depuis le latin

L’utilisateur a autorisé ce premier comparatif après avoir refusé la voix HADRA.
Jamal reste la voix des exercices. Aucun fichier actif, référence de score ou
fonctionnement de l’application n’est modifié.

## État du pilote

Le secret GitHub est disponible. La relance `38605552834` a confirmé le refus
API **HTTP 429 / `insufficient_quota`** : aucun nouveau MP3, aucun comparatif
OpenAI publié. Attendre que l’utilisateur active la facturation, ajoute des
crédits API ou corrige ses limites de quota avant tout nouvel appel.
L’abonnement ChatGPT ne fournit pas les crédits de cette API.

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

La page sera publiée à `/test-audio-openai/` seulement lorsque les dix nouveaux
MP3 sont prêts : vingt fichiers Avant/Jamal et Après/OpenAI, deux lecteurs,
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
