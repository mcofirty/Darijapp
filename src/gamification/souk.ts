/** Dirhams et souk : de quoi décorer l'appli (logique pure). Rien d'utile à l'apprentissage ne s'achète. */

/** 1 dirham par bonne réponse, plus un bonus de précision par activité ; 60 par théière ouverte, 50 par trésor du Parcours. */
export const DH_PAR_BONNE_REPONSE = 1
export const DH_PAR_THEIERE = 60
export const DH_PAR_TRESOR = 50
/** Bonus de précision d'une activité, selon le nombre d'erreurs : 0 → 10 DH, 1 → 5 DH, 2 → 2 DH, au-delà rien. */
export const BONUS_PRECISION = [10, 5, 2]

export function bonusPrecision(mauvaises: number): number {
  return BONUS_PRECISION[mauvaises] ?? 0
}

/** Dirhams d'une activité (session, leçon, quiz, mini-jeu) : moins il y a d'erreurs, plus elle rapporte. */
export function dirhamsDActivite({ bonnes, mauvaises }: { bonnes: number; mauvaises: number }): number {
  if (bonnes === 0) return 0
  return bonnes * DH_PAR_BONNE_REPONSE + bonusPrecision(mauvaises)
}

export function dirhamsGagnes({
  activites,
  theieres,
  tresors,
}: {
  activites: { bonnes: number; mauvaises: number }[]
  theieres: number
  tresors: number
}): number {
  return activites.reduce((t, a) => t + dirhamsDActivite(a), 0) + theieres * DH_PAR_THEIERE + tresors * DH_PAR_TRESOR
}

/** Rayons du souk : décor du jardin (plante, fond, objets, pot) et de l'appli (couleur, zellige, sons, confettis). */
export type Categorie = 'espece' | 'fond' | 'objet' | 'pot' | 'couleur' | 'zellige' | 'sons' | 'confettis'
/** Catégories où l'on choisit un seul article ; les objets, eux, s'affichent ou se rangent un à un. */
export type CategorieUnique = Exclude<Categorie, 'objet'>

export interface Article {
  id: string
  categorie: Categorie
  nom: string
  description: string
  prix: number
  /** Couleur d'aperçu dans le souk. */
  apercu: string
  /** Objet du jardin qui est un animal : rangé au rayon « Animaux ». */
  animal?: boolean
}

/** Articles gratuits, possédés d'office : les réglages de départ. */
export const PAR_DEFAUT: Record<CategorieUnique, string> = {
  espece: 'menthe',
  fond: 'ciel',
  pot: 'terre',
  couleur: 'drapeau',
  zellige: 'aucun',
  sons: 'classique',
  confettis: 'papiers',
}

export const ARTICLES: Article[] = [
  { id: 'drapeau', categorie: 'couleur', nom: 'Rouge du drapeau', description: 'La couleur de départ', prix: 0, apercu: '#c1272d' },
  { id: 'chefchaouen', categorie: 'couleur', nom: 'Bleu de Chefchaouen', description: 'Le bleu des ruelles de la ville bleue', prix: 150, apercu: '#2563c9' },
  { id: 'marrakech', categorie: 'couleur', nom: 'Ocre de Marrakech', description: 'La terre rouge de la ville ocre', prix: 150, apercu: '#b2491a' },
  { id: 'safran', categorie: 'couleur', nom: 'Safran de Taliouine', description: 'L’or rouge du Souss', prix: 200, apercu: '#8a6100' },
  { id: 'indigo', categorie: 'couleur', nom: 'Indigo du désert', description: 'Le bleu des hommes du désert', prix: 250, apercu: '#4b3fa8' },
  { id: 'rose', categorie: 'couleur', nom: 'Rose du Dadès', description: 'Les roses de Kelaat M’Gouna', prix: 200, apercu: '#b0185a' },
  { id: 'turquoise', categorie: 'couleur', nom: 'Turquoise d’Essaouira', description: 'Les barques bleues du port', prix: 250, apercu: '#00707d' },
  { id: 'atlas', categorie: 'couleur', nom: 'Vert de l’Atlas', description: 'Les cèdres du Moyen Atlas', prix: 200, apercu: '#2e7d32' },
  { id: 'nuit', categorie: 'couleur', nom: 'Nuit du Sahara', description: 'Le ciel étoilé du désert', prix: 300, apercu: '#283a6b' },
  { id: 'aucun', categorie: 'zellige', nom: 'Sans zellige', description: 'L’appli sans motif', prix: 0, apercu: 'transparent' },
  { id: 'etoile', categorie: 'zellige', nom: 'Zellige étoilé', description: 'Étoiles à huit branches, rouge et vert', prix: 120, apercu: '#c1272d' },
  { id: 'fassi', categorie: 'zellige', nom: 'Zellige de Fès', description: 'Losanges bleus et blancs', prix: 120, apercu: '#2563c9' },
  { id: 'tetouan', categorie: 'zellige', nom: 'Zellige de Tétouan', description: 'Hexagones verts et blancs', prix: 150, apercu: '#1d7a5f' },
  { id: 'meknes', categorie: 'zellige', nom: 'Zellige de Meknès', description: 'Octogones ocre et carrés bleus', prix: 150, apercu: '#d9822b' },
  { id: 'rabat', categorie: 'zellige', nom: 'Chevrons de Rabat', description: 'Zigzags noirs et blancs', prix: 180, apercu: '#1c1c1e' },
  { id: 'terre', categorie: 'pot', nom: 'Terre cuite', description: 'Le pot de départ de ta plante', prix: 0, apercu: '#c4693d' },
  { id: 'tadelakt', categorie: 'pot', nom: 'Tadelakt bleu', description: 'Enduit lisse et brillant', prix: 80, apercu: '#3a6ea5' },
  { id: 'safi', categorie: 'pot', nom: 'Céramique de Safi', description: 'Émail vert et motifs', prix: 100, apercu: '#1d7a5f' },
  { id: 'cuivre', categorie: 'pot', nom: 'Cuivre de Fès', description: 'Martelé à la main', prix: 120, apercu: '#b87333' },
  { id: 'tamegroute', categorie: 'pot', nom: 'Vert de Tamegroute', description: 'Émail vert qui coule, cuit au four à bois', prix: 140, apercu: '#4f7a28' },
  { id: 'berbere', categorie: 'pot', nom: 'Poterie berbère', description: 'Argile claire et triangles peints', prix: 160, apercu: '#d8c3a0' },
  { id: 'menthe', categorie: 'espece', nom: 'Menthe', description: 'La nana du thé, ta plante de départ', prix: 0, apercu: '#3fae5a' },
  { id: 'oranger', categorie: 'espece', nom: 'Oranger', description: 'Fleur d’oranger, puis oranges', prix: 200, apercu: '#ff8c1a' },
  { id: 'olivier', categorie: 'espece', nom: 'Olivier', description: 'Feuilles argentées et olives noires', prix: 250, apercu: '#7d8f5a' },
  { id: 'rosier', categorie: 'espece', nom: 'Rosier du Dadès', description: 'Les roses de Kelaat M’Gouna', prix: 300, apercu: '#e2445c' },
  { id: 'palmier', categorie: 'espece', nom: 'Palmier dattier', description: 'Palmes et grappes de dattes', prix: 350, apercu: '#a0662b' },
  { id: 'figuier', categorie: 'espece', nom: 'Figuier de Barbarie', description: 'Raquettes et figues de cactus', prix: 400, apercu: '#5b9a4a' },
  { id: 'jasmin', categorie: 'espece', nom: 'Jasmin', description: 'Fleurs blanches au parfum des riads', prix: 200, apercu: '#f4f1e6' },
  { id: 'grenadier', categorie: 'espece', nom: 'Grenadier', description: 'Fleurs rouge-orangé, puis grenades', prix: 300, apercu: '#d93a2b' },
  { id: 'arganier', categorie: 'espece', nom: 'Arganier', description: 'L’arbre du Souss et ses noix d’argan', prix: 350, apercu: '#9bb04a' },
  { id: 'ciel', categorie: 'fond', nom: 'Ciel clair', description: 'Le jardin tout simple', prix: 0, apercu: '#cfe8ff' },
  { id: 'riad', categorie: 'fond', nom: 'Cour de riad', description: 'Arcade, zellige et fontaine', prix: 250, apercu: '#e9d6b8' },
  { id: 'ruelle', categorie: 'fond', nom: 'Ruelle de Chefchaouen', description: 'Murs bleus et porte en bois', prix: 300, apercu: '#5b8fd6' },
  { id: 'dunes', categorie: 'fond', nom: 'Dunes de Merzouga', description: 'Sable orange au coucher du soleil', prix: 350, apercu: '#e8954a' },
  { id: 'montagnes', categorie: 'fond', nom: 'Sommets de l’Atlas', description: 'Neige sur le Toubkal, village en pisé', prix: 300, apercu: '#9ab7d6' },
  { id: 'port', categorie: 'fond', nom: 'Port d’Essaouira', description: 'Mer, remparts et barques bleues', prix: 350, apercu: '#3d8fc4' },
  { id: 'nuitetoilee', categorie: 'fond', nom: 'Nuit étoilée', description: 'La lune et les étoiles au-dessus du jardin', prix: 400, apercu: '#1b2550' },
  { id: 'lanterne', categorie: 'objet', nom: 'Lanterne', description: 'Fanous en cuivre ajouré', prix: 100, apercu: '#d4a017' },
  { id: 'theiere', categorie: 'objet', nom: 'Théière', description: 'Le thé à la menthe, à côté du pot', prix: 120, apercu: '#c0c0c8' },
  { id: 'cigogne', categorie: 'objet', nom: 'Cigogne', description: 'Celle des remparts de Rabat', prix: 200, apercu: '#f2f2f2', animal: true },
  { id: 'tapis', categorie: 'objet', nom: 'Tapis berbère', description: 'Sous le pot, losanges rouges', prix: 150, apercu: '#b3262e' },
  { id: 'tajine', categorie: 'objet', nom: 'Tajine', description: 'Le plat au couvercle pointu, devant le pot', prix: 100, apercu: '#b65a2c' },
  { id: 'chat', categorie: 'objet', nom: 'Chat de la médina', description: 'Il fait la sieste à côté de ta plante', prix: 180, apercu: '#e09a4a', animal: true },
  { id: 'tortue', categorie: 'objet', nom: 'Tortue grecque', description: 'Elle traverse le jardin, sans se presser', prix: 120, apercu: '#7a8a3a', animal: true },
  { id: 'poule', categorie: 'objet', nom: 'Poule beldi', description: 'La poule de la ferme, qui picore', prix: 100, apercu: '#a0522d', animal: true },
  { id: 'moineaux', categorie: 'objet', nom: 'Moineaux', description: 'Deux oiseaux qui passent dans le ciel', prix: 100, apercu: '#8a6a4a', animal: true },
  { id: 'fennec', categorie: 'objet', nom: 'Fennec', description: 'Le petit renard du désert aux grandes oreilles', prix: 250, apercu: '#e8b77a', animal: true },
  { id: 'dromadaire', categorie: 'objet', nom: 'Dromadaire', description: 'Au loin, il passe tranquillement', prix: 300, apercu: '#c8955a', animal: true },
  { id: 'classique', categorie: 'sons', nom: 'Sons classiques', description: 'Deux notes douces, ou une note grave', prix: 0, apercu: '#8e8e93' },
  { id: 'qraqeb', categorie: 'sons', nom: 'Qraqeb', description: 'Les castagnettes de fer des Gnaoua', prix: 150, apercu: '#5f5f6b' },
  { id: 'darbouka', categorie: 'sons', nom: 'Darbouka', description: 'Le « doum » et le « tek » du tambour', prix: 150, apercu: '#a0662b' },
  { id: 'oud', categorie: 'sons', nom: 'Oud', description: 'Deux cordes pincées du luth arabe', prix: 180, apercu: '#7a4a24' },
  { id: 'zaghrouta', categorie: 'sons', nom: 'Youyou', description: 'La zaghrouta des fêtes, pour chaque bonne réponse', prix: 250, apercu: '#c2185b' },
  { id: 'papiers', categorie: 'confettis', nom: 'Confettis', description: 'Papiers de couleur', prix: 0, apercu: '#ff9500' },
  { id: 'petales', categorie: 'confettis', nom: 'Pétales de rose', description: 'Une pluie de roses du Dadès', prix: 120, apercu: '#e2445c' },
  { id: 'etoiles', categorie: 'confettis', nom: 'Étoiles', description: 'Étoiles dorées à cinq branches', prix: 150, apercu: '#ffcc00' },
  { id: 'feuilles', categorie: 'confettis', nom: 'Feuilles de menthe', description: 'Une pluie de nana bien verte', prix: 120, apercu: '#3fae5a' },
  { id: 'pieces', categorie: 'confettis', nom: 'Pièces de dirham', description: 'Des pièces dorées qui tombent', prix: 200, apercu: '#d4a017' },
]

export function article(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id)
}

export function solde(gagnes: number, achats: { prix: number }[]): number {
  return gagnes - achats.reduce((t, a) => t + a.prix, 0)
}

export function possede(id: string, achats: { id: string }[]): boolean {
  return (article(id)?.prix ?? 1) === 0 || achats.some((a) => a.id === id)
}

/** Peut-on acheter cet article ? Raison à afficher sinon. */
export function achatPossible(id: string, soldeActuel: number, achats: { id: string }[]): { ok: true } | { ok: false; raison: string } {
  const a = article(id)
  if (!a) return { ok: false, raison: 'Article inconnu.' }
  if (possede(id, achats)) return { ok: false, raison: 'Déjà à toi.' }
  if (soldeActuel < a.prix) return { ok: false, raison: `Il te manque ${a.prix - soldeActuel} DH.` }
  return { ok: true }
}
