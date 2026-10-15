/** Collection de mots et badges (logique pure). */

/** Bronze : mot vu ; argent : retenu une semaine (boîte 3) ; or : retenu trois semaines (boîte 4). */
export type Maitrise = 'bronze' | 'argent' | 'or'

export const COULEURS_MAITRISE: Record<Maitrise, string> = { bronze: '#c47f3b', argent: '#9ea3a8', or: '#e0a800' }
export const NOMS_MAITRISE: Record<Maitrise, string> = { bronze: 'bronze', argent: 'argent', or: 'or' }

export function maitrise(boite: number): Maitrise {
  return boite >= 4 ? 'or' : boite === 3 ? 'argent' : 'bronze'
}

export function compterCollection(progressions: { boite: number }[]): Record<Maitrise, number> {
  const total: Record<Maitrise, number> = { bronze: 0, argent: 0, or: 0 }
  for (const p of progressions) total[maitrise(p.boite)]++
  return total
}

/** Objectif du programme : 300 mots en 3 mois. */
export const OBJECTIF_MOTS = 300

/** Points du « mustawa d nnbta » par boîte : un mot bien retenu vaut beaucoup plus qu'un mot juste vu. */
export const POINTS_MUSTAWA = [0, 1, 3, 6, 10]

/** « Mustawa d nnbta » (niveau de la plante, en darija) : score global qui monte avec les mots retenus. */
export function mustawa(progressions: { boite: number }[]): number {
  return progressions.reduce((t, p) => t + (POINTS_MUSTAWA[Math.min(4, Math.max(0, p.boite))] ?? 0), 0)
}

export interface StatsBadges {
  motsVus: number
  motsArgent: number
  motsOr: number
  meilleureSerie: number
  activites: number
  sansFaute: number
  recordExpress: number
  recordSons: number
  /** Niveau (palier de la plante, 1 à 30). */
  niveau: number
  xpTotal: number
  /** Essais de Dis-le notés 80 ou plus, et notés 100. */
  excellents: number
  parfaits: number
  /** Scènes de dialogue jouées, et jouées sans faute. */
  dialogues: number
  dialoguesParfaits: number
  grammaire: number
  /** Parties de marchandage et de taxi. */
  marchandages: number
  taxis: number
  tampons: number
  theieres: number
  achats: number
  motsAjoutes: number
}

export type FamilleBadge =
  | 'mots'
  | 'maitrise'
  | 'serie'
  | 'pratique'
  | 'plante'
  | 'prononciation'
  | 'parler'
  | 'jeux'
  | 'voyage'
  | 'souk'

export const FAMILLES_BADGES: { id: FamilleBadge; titre: string }[] = [
  { id: 'mots', titre: 'Vocabulaire' },
  { id: 'maitrise', titre: 'Mots retenus' },
  { id: 'serie', titre: 'Régularité' },
  { id: 'pratique', titre: 'Pratique' },
  { id: 'plante', titre: 'Ma plante' },
  { id: 'prononciation', titre: 'Prononciation' },
  { id: 'parler', titre: 'Parler' },
  { id: 'jeux', titre: 'Jeux' },
  { id: 'voyage', titre: 'Voyage et théière' },
  { id: 'souk', titre: 'Souk et partage' },
]

export interface Badge {
  id: string
  famille: FamilleBadge
  titre: string
  description: string
  /** Ce qui est compté, et le seuil à atteindre. */
  mesure: keyof StatsBadges
  seuil: number
}

/** Badge obtenu : la mesure atteint le seuil. */
export function badgeObtenu(b: Badge, s: StatsBadges): boolean {
  return s[b.mesure] >= b.seuil
}

/** Avancée vers un badge, de 0 à 1. */
export function avancementBadge(b: Badge, s: StatsBadges): number {
  return Math.min(1, s[b.mesure] / b.seuil)
}

const b = (famille: FamilleBadge, mesure: keyof StatsBadges, seuil: number, id: string, titre: string, description: string): Badge => ({
  id,
  famille,
  titre,
  description,
  mesure,
  seuil,
})

export const BADGES: Badge[] = [
  b('mots', 'motsVus', 10, 'mots-10', 'Premiers mots', 'Découvre 10 mots'),
  b('mots', 'motsVus', 25, 'mots-25', 'Petit carnet', 'Découvre 25 mots'),
  b('mots', 'motsVus', 50, 'mots-50', '50 mots', 'Découvre 50 mots'),
  b('mots', 'motsVus', 100, 'mots-100', 'Centaine', 'Découvre 100 mots'),
  b('mots', 'motsVus', 150, 'mots-150', '150 mots', 'Découvre 150 mots'),
  b('mots', 'motsVus', 200, 'mots-200', '200 mots', 'Découvre 200 mots'),
  b('mots', 'motsVus', OBJECTIF_MOTS, 'mots-300', 'Objectif 300', 'Découvre 300 mots'),
  b('mots', 'motsVus', 500, 'mots-500', 'Bavard', 'Découvre 500 mots'),
  b('mots', 'motsVus', 1000, 'mots-1000', 'Dictionnaire vivant', 'Découvre 1 000 mots'),
  b('maitrise', 'motsArgent', 10, 'argent-10', '10 en argent', 'Retiens 10 mots une semaine'),
  b('maitrise', 'motsArgent', 50, 'argent-50', '50 en argent', 'Retiens 50 mots une semaine'),
  b('maitrise', 'motsOr', 10, 'or-10', '10 mots en or', 'Retiens 10 mots trois semaines'),
  b('maitrise', 'motsOr', 50, 'or-50', '50 mots en or', 'Retiens 50 mots trois semaines'),
  b('maitrise', 'motsOr', 100, 'or-100', '100 mots en or', 'Retiens 100 mots trois semaines'),
  b('maitrise', 'motsOr', OBJECTIF_MOTS, 'or-300', 'Trésor de mots', 'Retiens 300 mots trois semaines'),
  b('serie', 'meilleureSerie', 3, 'serie-3', '3 jours', 'Pratique 3 jours d’affilée'),
  b('serie', 'meilleureSerie', 7, 'serie-7', 'Une semaine', 'Pratique 7 jours d’affilée'),
  b('serie', 'meilleureSerie', 14, 'serie-14', 'Deux semaines', 'Pratique 14 jours d’affilée'),
  b('serie', 'meilleureSerie', 30, 'serie-30', 'Un mois', 'Pratique 30 jours d’affilée'),
  b('serie', 'meilleureSerie', 60, 'serie-60', 'Deux mois', 'Pratique 60 jours d’affilée'),
  b('serie', 'meilleureSerie', 100, 'serie-100', '100 jours', 'Pratique 100 jours d’affilée'),
  b('pratique', 'activites', 1, 'premiers-pas', 'Premiers pas', 'Termine ta première activité'),
  b('pratique', 'activites', 10, 'activites-10', 'Lancé', 'Termine 10 activités'),
  b('pratique', 'activites', 50, 'activites-50', 'Assidu', 'Termine 50 activités'),
  b('pratique', 'activites', 100, 'activites-100', 'Infatigable', 'Termine 100 activités'),
  b('pratique', 'activites', 250, 'activites-250', 'Pilier', 'Termine 250 activités'),
  b('pratique', 'sansFaute', 1, 'sans-faute', 'Sans faute', 'Réussis une activité sans erreur'),
  b('pratique', 'sansFaute', 10, 'sans-faute-10', 'Précis', '10 activités sans erreur'),
  b('pratique', 'sansFaute', 50, 'sans-faute-50', 'Impeccable', '50 activités sans erreur'),
  b('plante', 'niveau', 7, 'niveau-germe', 'Ça perce !', 'Atteins le stade Germe'),
  b('plante', 'niveau', 10, 'niveau-pousse', 'Pousse', 'Atteins le stade Pousse'),
  b('plante', 'niveau', 16, 'niveau-feuilles', 'Feuillage', 'Atteins le stade Feuilles'),
  b('plante', 'niveau', 22, 'niveau-fleur', 'En fleur', 'Atteins le stade Fleur'),
  b('plante', 'niveau', 28, 'niveau-arbre', 'Arbre', 'Atteins le stade Arbre'),
  b('plante', 'niveau', 30, 'niveau-centenaire', 'Centenaire', 'Atteins le niveau 30'),
  b('plante', 'xpTotal', 1000, 'xp-1000', '1 000 XP', 'Gagne 1 000 XP'),
  b('plante', 'xpTotal', 5000, 'xp-5000', '5 000 XP', 'Gagne 5 000 XP'),
  b('prononciation', 'excellents', 1, 'excellent-1', 'Première étoile', 'Un mot noté 80 ou plus'),
  b('prononciation', 'excellents', 10, 'excellent-10', 'Belle voix', '10 mots notés 80 ou plus'),
  b('prononciation', 'excellents', 50, 'excellent-50', 'Accent du bled', '50 mots notés 80 ou plus'),
  b('prononciation', 'parfaits', 1, 'parfait', '100 sur 100', 'Un mot noté 100'),
  b('prononciation', 'recordSons', 10, 'oreille-10', 'Bonne oreille', '10 points à la Chasse aux sons'),
  b('prononciation', 'recordSons', 20, 'oreille', 'Oreille fine', '20 points à la Chasse aux sons'),
  b('prononciation', 'recordSons', 40, 'oreille-40', 'Oreille d’or', '40 points à la Chasse aux sons'),
  b('parler', 'dialogues', 1, 'dialogue-1', 'Premier échange', 'Joue un dialogue'),
  b('parler', 'dialogues', 8, 'dialogue-8', 'Tous les dialogues', 'Joue les 8 dialogues'),
  b('parler', 'dialoguesParfaits', 1, 'dialogue-parfait', 'Comme un local', 'Un dialogue sans erreur'),
  b('parler', 'grammaire', 1, 'grammaire-1', 'Grammairien', 'Termine une leçon de grammaire'),
  b('parler', 'grammaire', 12, 'grammaire-12', 'Règles en poche', 'Termine 12 leçons de grammaire'),
  b('jeux', 'recordExpress', 10, 'eclair-10', 'Rapide', '10 bonnes réponses au Quiz express'),
  b('jeux', 'recordExpress', 15, 'eclair', 'Éclair', '15 bonnes réponses au Quiz express'),
  b('jeux', 'recordExpress', 25, 'eclair-25', 'Foudre', '25 bonnes réponses au Quiz express'),
  b('jeux', 'marchandages', 1, 'marchand', 'Marchandeur', 'Marchande au souk'),
  b('jeux', 'marchandages', 10, 'marchand-10', 'Roi du souk', 'Marchande 10 fois'),
  b('jeux', 'taxis', 1, 'taxi', 'Chauffeur', 'Conduis le taxi'),
  b('jeux', 'taxis', 10, 'taxi-10', 'Petit taxi', 'Conduis le taxi 10 fois'),
  b('voyage', 'tampons', 1, 'tampon-1', 'Premier tampon', 'Un tampon dans ton passeport'),
  b('voyage', 'tampons', 5, 'tampon-5', 'Mi-parcours', '5 tampons dans ton passeport'),
  b('voyage', 'tampons', 10, 'tampon-10', 'Jusqu’à Merzouga', 'Les 10 tampons du voyage'),
  b('voyage', 'theieres', 1, 'theiere-1', 'Premier thé', 'Ouvre la théière'),
  b('voyage', 'theieres', 10, 'theiere-10', 'Thé à la menthe', 'Ouvre la théière 10 fois'),
  b('voyage', 'theieres', 30, 'theiere-30', 'Maître du thé', 'Ouvre la théière 30 fois'),
  b('souk', 'achats', 1, 'achat-1', 'Premier achat', 'Achète un article au souk'),
  b('souk', 'achats', 10, 'achat-10', 'Collectionneur', 'Achète 10 articles au souk'),
  b('souk', 'achats', 25, 'achat-25', 'Grand décorateur', 'Achète 25 articles au souk'),
  b('souk', 'motsAjoutes', 1, 'mot-ajoute', 'Mot de famille', 'Ajoute un mot dans « Mes mots »'),
]

/**
 * Acquis vérifiés : mots retrouvés lors d'une révision ultérieure (boîte 3 ou plus). Un mot réussi une
 * seule fois, le jour de sa découverte, n'est qu'en boîte 2 : il ne compte pas encore.
 */
export function acquisVerifies(progressions: { boite: number }[]): number {
  return progressions.filter((p) => p.boite >= 3).length
}

/**
 * Rang d'un badge dans sa mesure (0 bronze, 1 argent, 2 or, 3 platine) : les badges d'une même mesure,
 * rangés par seuil, montent en gamme ; le premier est en bronze, le dernier au plus haut.
 */
export function rangBadge(badge: Badge, tous: Badge[] = BADGES): 0 | 1 | 2 | 3 {
  const meme = tous.filter((x) => x.mesure === badge.mesure).sort((x, y) => x.seuil - y.seuil)
  const i = meme.findIndex((x) => x.id === badge.id)
  if (meme.length <= 1 || i < 0) return 0
  return Math.round((i / (meme.length - 1)) * 3) as 0 | 1 | 2 | 3
}

/** Couleurs de l'anneau des badges selon leur rang. */
export const COULEURS_RANG = ['#c47f3b', '#b9bfc5', '#e8b923', '#9fd8e6'] as const
