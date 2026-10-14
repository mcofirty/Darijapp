# Harmonisation du latin — 14 octobre 2026

Le contrôle couvre les 3 516 couples latin/arabe des données JSON. 176 champs `latin` ont été corrigés dans 22 fichiers : emprunts français réécrits en latin explicite, incohérence `3echtan` corrigée en `3tchan`, mot séparé `lah` développé en `allah`. Les autres formes attestées sont conservées.

Convention : `3 = ع`, `7 = ح`, `9 = ق`, `kh = خ`, `gh = غ`, `ch = ش`, `2` pour une hamza établie. Aucun chiffre n’est ajouté sur la seule présence d’un alif non prononcé ; les voyelles et variantes régionales ne sont pas inventées.

Les aides `prononciation` ne sont ni la source des corrections ni modifiées par cette tâche. Arabe, français, identifiants, ordre des entrées, noms des MP3 et fonctionnalités sont inchangés. Les références pré-calculées du score sont recalculées pour les nouveaux latins. La voix existante lit toujours l’arabe ; cette modification ne met pas en place un nouveau TTS.

Les incertitudes de sens/accord de l’audit (notamment « la porte est verte ») demandent une correction linguistique distincte portant aussi sur l’arabe. Cette harmonisation n’est pas une certification de prononciation.

Le verbe « signer » est écrit `we99e3` pour distinguer sa consonne géminée ; le contrôle de translittération accepte une unité latine doublée face à une lettre arabe dont la chadda est omise. Le modèle de scoring actuel regroupe encore les consonnes répétées et ne certifie donc pas cette distinction.

## Changements appliqués

| Fichier / entrée | Avant | Après |
|---|---|---|
| adjectifs.json / adjectifs-052 (exemple) | ana 3echtan, 3tini lma | ana 3tchan, 3tini lma |
| chemin.json / chemin-001 | fin kayna lma7atta d train? | fin kayna lma7atta d tran? |
| chemin.json / chemin-001 (exemple) | sme7 lia, fin kayna lma7atta d train? | sme7 lia, fin kayna lma7atta d tran? |
| chemin.json / chemin-008 (exemple) | ch7al men d9i9a b ttaxi? | ch7al men d9i9a b ttaksi? |
| chemin.json / chemin-019 | kan-9elleb 3la taxi | kan-9elleb 3la taksi |
| chemin.json / chemin-019 (exemple) | kan9elleb 3la taxi l lmatar | kan9elleb 3la taksi l lmatar |
| chemin.json / chemin-020 (exemple) | ch7al bach nmchi ltemma b ttaxi? | ch7al bach nmchi ltemma b ttaksi? |
| chemin.json / chemin-021 | ch3el lcompteur, 3afak | ch3el lkontor, 3afak |
| chemin.json / chemin-021 (exemple) | ch3el lcompteur, 3afak, ma bghitch ntkhasem | ch3el lkontor, 3afak, ma bghitch ntkhasem |
| chemin.json / chemin-024 | tiki dyal l'aller | tiki dyal lali |
| chemin.json / chemin-024 (exemple) | bghit tiki dyal l'aller l fes | bghit tiki dyal lali l fes |
| chemin.json / chemin-025 | tiki aller-retour | tiki ali-rotor |
| chemin.json / chemin-025 (exemple) | ch7al tiki aller-retour l tanja? | ch7al tiki ali-rotor l tanja? |
| chemin.json / chemin-026 | fo9ach kaykherrej train? | fo9ach kaykherrej tran? |
| chemin.json / chemin-026 (exemple) | fo9ach kaykherrej train l mrrakech? | fo9ach kaykherrej tran l mrrakech? |
| chemin.json / chemin-029 | bghit nrezerver | bghit nrezervi |
| chemin.json / chemin-030 | 3ndi reservation | 3ndi rezervasyon |
| chemin.json / chemin-030 (exemple) | 3ndi reservation b smiti | 3ndi rezervasyon b smiti |
| conversation.json / conversation-008 (exemple) | kant3ellem ddarija f lapplication | kant3ellem ddarija f laplikasyon |
| conversation.json / conversation-020 (exemple) | kifach kangolo merci b ddarija? | kifach kangolo mersi b ddarija? |
| corps.json / corps-001 (exemple) | lsport mzyan l ljsem | lspor mzyan l ljsem |
| corps.json / corps-049 (exemple) | wlit r9i9 men ssport | wlit r9i9 men sspor |
| couleurs.json / couleurs-012 (exemple) | ttaxi sfer f had lmdina | ttaksi sfer f had lmdina |
| cuisine.json / cuisine-006 | forchetta | forchita |
| cuisine.json / cuisine-006 (exemple) | jib lia forchetta | jib lia forchita |
| expressions.json / expressions-018 (exemple) | kayn chi taxi? | kayn chi taksi? |
| loisirs.json / loisirs-001 | sport | spor |
| loisirs.json / loisirs-001 (exemple) | kandir sport kol nhar | kandir spor kol nhar |
| loisirs.json / loisirs-008 | but | bi |
| loisirs.json / loisirs-008 (exemple) | dkhel wa7ed lbut zwin | dkhel wa7ed lbi zwin |
| loisirs.json / loisirs-026 | musculation | mouskolasyon |
| loisirs.json / loisirs-026 (exemple) | kandir musculation f lsalle | kandir mouskolasyon f lsal |
| loisirs.json / loisirs-032 | boxe | boks |
| loisirs.json / loisirs-032 (exemple) | khoya kaydir boxe | khoya kaydir boks |
| maison.json / maison-009 | couloir | koulwar |
| maison.json / maison-009 (exemple) | 7ett ssebbat f lcouloir | 7ett ssebbat f lkoulwar |
| maison.json / maison-010 | balcon | balkon |
| maison.json / maison-010 (exemple) | kanchreb atay f lbalcon | kanchreb atay f lbalkon |
| maison.json / maison-034 | placar | plakar |
| maison.json / maison-034 (exemple) | 7ett lvaliza f lplacar | 7ett lvaliza f lplakar |
| maison.json / maison-043 | kongelator | konjilator |
| maison.json / maison-043 (exemple) | l7em f lkongelator | l7em f lkonjilator |
| maison.json / maison-052 | chauffage | choufaj |
| maison.json / maison-052 (exemple) | ch3el chauffage, kayn lberd | ch3el choufaj, kayn lberd |
| maison.json / maison-055 | saché d zbala | sachi d zbala |
| maison.json / maison-055 (exemple) | chri saché d zbala men l7anout | chri sachi d zbala men l7anout |
| nourriture.json / nourriture-040 | raïb | rayb |
| nourriture.json / nourriture-046 | sandwich | sandwitch |
| nourriture.json / nourriture-046 (exemple) | bghit sandwich b ttoun | bghit sandwitch b ttoun |
| nourriture.json / nourriture-047 | pizza | pitsa |
| nourriture.json / nourriture-047 (exemple) | chrina pizza kbira | chrina pitsa kbira |
| nourriture.json / nourriture-104 | glace | glas |
| nourriture.json / nourriture-104 (exemple) | glace b chokola 3afak | glas b chokola 3afak |
| nourriture.json / nourriture-105 | dessert | disir |
| nourriture.json / nourriture-105 (exemple) | chnou kayn f dessert? | chnou kayn f disir? |
| numerique.json / numerique-002 | portable | portabl |
| numerique.json / numerique-002 (exemple) | nsit lportable f ttaxi | nsit lportabl f ttaksi |
| numerique.json / numerique-005 | portable PC | portabl pi si |
| numerique.json / numerique-005 (exemple) | kankhdem b portable PC f ddar | kankhdem b portabl pi si f ddar |
| numerique.json / numerique-007 | écran | ikran |
| numerique.json / numerique-007 (exemple) | lécran therres | likran therres |
| numerique.json / numerique-011 | chargeur | charjour |
| numerique.json / numerique-011 (exemple) | 3ndek chi chargeur? | 3ndek chi charjour? |
| numerique.json / numerique-014 | casque | kask |
| numerique.json / numerique-014 (exemple) | lbes lcasque w sme3 | lbes lkask w sme3 |
| numerique.json / numerique-024 | rézo | rizo |
| numerique.json / numerique-024 (exemple) | ma kaynch rrézo hna | ma kaynch rrizo hna |
| numerique.json / numerique-025 (exemple) | ch7al lcode dyal lwifi? | ch7al lkod dyal lwifi? |
| numerique.json / numerique-026 | code secret | kod sikri |
| numerique.json / numerique-026 (exemple) | nsit lcode secret dyali | nsit lkod sikri dyali |
| numerique.json / numerique-027 | compte | kont |
| numerique.json / numerique-027 (exemple) | 7ell compte jdid | 7ell kont jdid |
| numerique.json / numerique-028 | connexion | koniksyon |
| numerique.json / numerique-028 (exemple) | lconnexion d3ifa bzaf | lkoniksyon d3ifa bzaf |
| numerique.json / numerique-031 (exemple) | sift lia llien f lwhatsapp | sift lia llien f lwatsap |
| numerique.json / numerique-032 | telecharger | tilicharji |
| numerique.json / numerique-032 (exemple) | ghadi ntelecharger lfilm | ghadi ntilicharji lfilm |
| numerique.json / numerique-033 (exemple) | sift lia lmesaj daba | sift lia lmisaj daba |
| numerique.json / numerique-036 | copier | kopiye |
| numerique.json / numerique-036 (exemple) | copier ladresse w sifteha | kopiye ladris w sifteha |
| numerique.json / numerique-037 | coller | koli |
| numerique.json / numerique-037 (exemple) | coller lmessage hna | koli lmisaj hna |
| numerique.json / numerique-042 | supprimer | souprimi |
| numerique.json / numerique-042 (exemple) | supprimer lmesaj l9dim | souprimi lmisaj l9dim |
| numerique.json / numerique-053 | rézo sosyo | rizo sosyo |
| numerique.json / numerique-053 (exemple) | kaydouz lw9t f rrézo sosyo | kaydouz lw9t f rrizo sosyo |
| organisation.json / organisation-017 | wach twesslek lmesaj dyali? | wach twesslek lmisaj dyali? |
| organisation.json / organisation-017 (exemple) | wach twesslek lmesaj dyali lbare7? | wach twesslek lmisaj dyali lbare7? |
| organisation.json / organisation-032 (exemple) | hadchi ma kaykhdemch, 3awed chargih | hadchi ma kaykhdemch, 3awed charjih |
| parler/dialogues.json / dia-taxi-3 | ch3el lcompteur, 3afak | ch3el lkontor, 3afak |
| rencontres.json / rencontres-018 | sift lia mesaj | sift lia misaj |
| rencontres.json / rencontres-018 (exemple) | sift lia mesaj mlli twsel | sift lia misaj mlli twsel |
| restaurant.json / restaurant-005 | bghit lmenu | bghit lmino |
| restaurant.json / restaurant-005 (exemple) | bghit lmenu, chokran | bghit lmino, chokran |
| restaurant.json / restaurant-006 | wach 3ndkom lmenu? | wach 3ndkom lmino? |
| restaurant.json / restaurant-006 (exemple) | wach 3ndkom lmenu b lfransawiya? | wach 3ndkom lmino b lfransawiya? |
| restaurant.json / restaurant-008 | achno lplat d lyom? | achno lpla d lyom? |
| restaurant.json / restaurant-008 (exemple) | achno lplat d lyom? ljem3a kayn lkouskous | achno lpla d lyom? ljem3a kayn lkouskous |
| restaurant.json / restaurant-040 (exemple) | jouj sandwich, bach nakhod m3aya, 3afak | jouj sandwitch, bach nakhod m3aya, 3afak |
| salutations.json / salutations-016 (exemple) | sme7 lia, fin kayn taxi? | sme7 lia, fin kayn taksi? |
| salutations.json / salutations-035 | lah yjazik bikhir | allah yjazik bikhir |
| salutations.json / salutations-035 (exemple) | lah yjazik bikhir 3la had lkhedma | allah yjazik bikhir 3la had lkhedma |
| salutations.json / salutations-040 | lah y3awnek | allah y3awnek |
| salutations.json / salutations-040 (exemple) | lah y3awnek f lkhedma | allah y3awnek f lkhedma |
| souk.json / souk-031 | reçu | rousi |
| souk.json / souk-031 (exemple) | 3tini reçu 3afak | 3tini rousi 3afak |
| souk.json / souk-032 | tiki d caisse | tiki d kis |
| souk.json / souk-032 (exemple) | khelli tiki d caisse m3ak | khelli tiki d kis m3ak |
| souk.json / souk-036 | promotion | promosyon |
| souk.json / souk-036 (exemple) | had lmontouj f promotion | had lmontouj f promosyon |
| souk.json / souk-056 | caisse | kis |
| souk.json / souk-056 (exemple) | khelles f caisse | khelles f kis |
| souk.json / souk-079 | fin kaynin kabinat dyal l'essayage? | fin kaynin kabinat dyal lissayaj? |
| souk.json / souk-079 (exemple) | sme7 lia, fin kaynin kabinat dyal l'essayage? | sme7 lia, fin kaynin kabinat dyal lissayaj? |
| souk.json / souk-085 | bghit reçu | bghit rousi |
| souk.json / souk-085 (exemple) | bghit reçu bach nrje3 ssel3a | bghit rousi bach nrje3 ssel3a |
| souk.json / souk-094 | wach 3ndek sac? | wach 3ndek sak? |
| souk.json / souk-094 (exemple) | wach 3ndek sac kbir? | wach 3ndek sak kbir? |
| transports.json / transports-001 | taxi | taksi |
| transports.json / transports-001 (exemple) | fin kayn taxi? | fin kayn taksi? |
| transports.json / transports-021 | petit taxi | poti taksi |
| transports.json / transports-021 (exemple) | chedd petit taxi l lma7atta | chedd poti taksi l lma7atta |
| transports.json / transports-022 | grand taxi | grand taksi |
| transports.json / transports-022 (exemple) | grand taxi kaymchi l fes | grand taksi kaymchi l fes |
| transports.json / transports-028 | scooter | skouter |
| transports.json / transports-028 (exemple) | scooter sghir w khfif | skouter sghir w khfif |
| transports.json / transports-031 | chauffeur | chifour |
| transports.json / transports-031 (exemple) | chauffeur dyal ttaxi driyef | chifour dyal ttaksi driyef |
| transports.json / transports-034 | reservation | rezervasyon |
| transports.json / transports-034 (exemple) | 3ndi reservation f lotel | 3ndi rezervasyon f lotel |
| transports.json / transports-060 (exemple) | tle3 f ttaxi | tle3 f ttaksi |
| travail.json / travail-025 | congé | konji |
| travail.json / travail-025 (exemple) | khdit congé dyal simana | khdit konji dyal simana |
| travail.json / travail-031 | mesaj | misaj |
| travail.json / travail-031 (exemple) | khelli lia mesaj | khelli lia misaj |
| verbes.json / verbes-021 (exemple) | khda ttaxi l lmatar | khda ttaksi l lmatar |
| verbes.json / verbes-022 (exemple) | twesselt b lmesaj dyalek | twesselt b lmisaj dyalek |
| verbes.json / verbes-083 | rezerver | rezervi |
| verbes.json / verbes-084 (exemple) | lgha rrendez-vous dyalo | lgha rrondi vou dyalo |
| vetements.json / vetements-007 | sweat | swit |
| vetements.json / vetements-007 (exemple) | had sweat skhoun bzaf | had swit skhoun bzaf |
| vetements.json / vetements-010 | blouson | blouzon |
| vetements.json / vetements-010 (exemple) | lbes lblouson dyal ljeld | lbes lblouzon dyal ljeld |
| vetements.json / vetements-020 | sbabat sport | sbabat spor |
| vetements.json / vetements-020 (exemple) | bghit sbabet sport l ljri | bghit sbabet spor l ljri |
| vetements.json / vetements-027 | boné | boni |
| vetements.json / vetements-027 (exemple) | lbes boné, kayn ttelj | lbes boni, kayn ttelj |
| vetements.json / vetements-033 | sac | sak |
| vetements.json / vetements-034 | sac d dher | sak d dher |
| vetements.json / vetements-049 | taille | tay |
| vetements.json / vetements-049 (exemple) | chmen taille kat9iss? | chmen tay kat9iss? |
| vetements.json / vetements-050 (exemple) | bghit taille mtwasset | bghit tay mtwasset |
| ville.json / ville-012 | supermarché | soupermarchi |
| ville.json / ville-012 (exemple) | chrit kolchi men supermarché | chrit kolchi men soupermarchi |
| ville.json / ville-018 (exemple) | lotil dyalna fih piscine | lotil dyalna fih pisin |
| ville.json / ville-021 | guichet otomatik | gichi otomatik |
| ville.json / ville-021 (exemple) | fin kayn chi guichet otomatik? | fin kayn chi gichi otomatik? |
| ville.json / ville-025 | jendarmerie | jondarmri |
| ville.json / ville-025 (exemple) | ljendarmerie f lmdakhel dyal lmdina | ljondarmri f lmdakhel dyal lmdina |
| ville.json / ville-034 | stade | stad |
| ville.json / ville-034 (exemple) | mchina l stade nchoufo lmatch | mchina l stad nchoufo lmatch |
| ville.json / ville-035 (exemple) | ddrari f lpiscine | ddrari f lpisin |
| ville.json / ville-036 | sala d sport | sala d spor |
| ville.json / ville-036 (exemple) | kanmchi l sala d sport tlata d lmrat | kanmchi l sala d spor tlata d lmrat |
| ville.json / ville-037 | jardin | jardan |
| ville.json / ville-037 (exemple) | tmechina f jardin | tmechina f jardan |
| ville.json / ville-043 | ma7atta d train | ma7atta d tran |
| ville.json / ville-043 (exemple) | ma7atta d train 9riba men lotil | ma7atta d tran 9riba men lotil |
| ville.json / ville-044 | station d lessans | stasyon d lessans |
| ville.json / ville-044 (exemple) | w9ef f station d lessans | w9ef f stasyon d lessans |
| ville.json / ville-050 | rond-point | rond pwan |
| ville.json / ville-050 (exemple) | men b3d rond-point, dour 3la limen | men b3d rond pwan, dour 3la limen |
| ville.json / ville-052 | passage piéton | pasaj piton |
| ville.json / ville-052 (exemple) | 9te3 men passage piéton | 9te3 men pasaj piton |
| verbes.json / verbes-085 | we9e3 | we99e3 |
| verbes.json / verbes-085 (exemple) | we9e3 hna 3afak | we99e3 hna 3afak |
