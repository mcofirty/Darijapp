/** Dirhams et souk : de quoi décorer l'appli (logique pure). Rien d'utile à l'apprentissage ne s'achète. */

/** 1 dirham par bonne réponse, 60 par théière ouverte, 50 par trésor du Parcours. */
export const DH_PAR_BONNE_REPONSE = 1
export const DH_PAR_THEIERE = 60
export const DH_PAR_TRESOR = 50

export function dirhamsGagnes({ bonnes, theieres, tresors }: { bonnes: number; theieres: number; tresors: number }): number {
  return bonnes * DH_PAR_BONNE_REPONSE + theieres * DH_PAR_THEIERE + tresors * DH_PAR_TRESOR
}

export type Categorie = 'couleur' | 'zellige' | 'pot'

export interface Article {
  id: string
  categorie: Categorie
  nom: string
  description: string
  prix: number
  /** Couleur d'aperçu dans le souk. */
  apercu: string
}

/** Articles gratuits, possédés d'office : les réglages de départ. */
export const PAR_DEFAUT: Record<Categorie, string> = { couleur: 'drapeau', zellige: 'aucun', pot: 'terre' }

export const ARTICLES: Article[] = [
  { id: 'drapeau', categorie: 'couleur', nom: 'Rouge du drapeau', description: 'La couleur de départ', prix: 0, apercu: '#c1272d' },
  { id: 'chefchaouen', categorie: 'couleur', nom: 'Bleu de Chefchaouen', description: 'Le bleu des ruelles de la ville bleue', prix: 150, apercu: '#2563c9' },
  { id: 'marrakech', categorie: 'couleur', nom: 'Ocre de Marrakech', description: 'La terre rouge de la ville ocre', prix: 150, apercu: '#b2491a' },
  { id: 'safran', categorie: 'couleur', nom: 'Safran de Taliouine', description: 'L’or rouge du Souss', prix: 200, apercu: '#8a6100' },
  { id: 'indigo', categorie: 'couleur', nom: 'Indigo du désert', description: 'Le bleu des hommes du désert', prix: 250, apercu: '#4b3fa8' },
  { id: 'aucun', categorie: 'zellige', nom: 'Sans zellige', description: 'La carte du jour toute simple', prix: 0, apercu: 'transparent' },
  { id: 'etoile', categorie: 'zellige', nom: 'Zellige étoilé', description: 'Étoiles à huit branches, rouge et vert', prix: 120, apercu: '#c1272d' },
  { id: 'fassi', categorie: 'zellige', nom: 'Zellige de Fès', description: 'Losanges bleus et blancs', prix: 120, apercu: '#2563c9' },
  { id: 'terre', categorie: 'pot', nom: 'Terre cuite', description: 'Le pot de départ de ta plante', prix: 0, apercu: '#c4693d' },
  { id: 'tadelakt', categorie: 'pot', nom: 'Tadelakt bleu', description: 'Enduit lisse et brillant', prix: 80, apercu: '#3a6ea5' },
  { id: 'safi', categorie: 'pot', nom: 'Céramique de Safi', description: 'Émail vert et motifs', prix: 100, apercu: '#1d7a5f' },
  { id: 'cuivre', categorie: 'pot', nom: 'Cuivre de Fès', description: 'Martelé à la main', prix: 120, apercu: '#b87333' },
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
