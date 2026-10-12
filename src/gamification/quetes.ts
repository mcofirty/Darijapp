/** Quêtes du jour et théière-coffre (logique pure). */

/** Ce qui a été fait aujourd'hui, tiré de l'historique des activités et du mode écoute. */
export interface StatsDuJour {
  sessions: number
  quiz: number
  express: number
  sons: number
  /** Activités terminées sans aucune erreur (au moins une bonne réponse). */
  sansFaute: number
  xp: number
  nouveaux: number
  /** Mots entendus en mode écoute. */
  ecoutes: number
}

export interface Quete {
  id: string
  titre: string
  objectif: number
  mesure: keyof StatsDuJour
}

/** XP de la théière quand les 3 quêtes du jour sont faites. */
export const XP_COFFRE = 60

/** Toujours proposée : c'est le rendez-vous quotidien. */
export const QUETE_SESSION: Quete = { id: 'session', titre: 'Termine une session du jour', objectif: 1, mesure: 'sessions' }

/** Les deux autres quêtes du jour sont tirées de cette liste, selon la date. */
export const QUETES: Quete[] = [
  { id: 'deux-sessions', titre: 'Termine 2 sessions', objectif: 2, mesure: 'sessions' },
  { id: 'sans-faute', titre: 'Réussis une activité sans faute', objectif: 1, mesure: 'sansFaute' },
  { id: 'quiz', titre: 'Fais un quiz de 5 questions', objectif: 1, mesure: 'quiz' },
  { id: 'express', titre: 'Joue au Quiz express', objectif: 1, mesure: 'express' },
  { id: 'sons', titre: 'Joue à la Chasse aux sons', objectif: 1, mesure: 'sons' },
  { id: 'xp', titre: 'Gagne 40 XP', objectif: 40, mesure: 'xp' },
  { id: 'nouveaux', titre: 'Apprends 5 nouveaux mots', objectif: 5, mesure: 'nouveaux' },
  { id: 'ecoute', titre: 'Écoute 10 mots en mode écoute', objectif: 10, mesure: 'ecoutes' },
]

/** Nombre tiré de la date : les mêmes quêtes toute la journée, d'autres le lendemain. */
function graineDuJour(date: string): number {
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) % 1_000_003
  return h
}

/** Les 3 quêtes du jour : la session, puis deux quêtes différentes tirées selon la date. */
export function quetesDuJour(date: string, pool: Quete[] = QUETES): Quete[] {
  const g = graineDuJour(date)
  const premiere = g % pool.length
  const seconde = (premiere + 1 + (Math.floor(g / pool.length) % (pool.length - 1))) % pool.length
  return [QUETE_SESSION, pool[premiere], pool[seconde]]
}

export interface Avancement {
  quete: Quete
  valeur: number
  faite: boolean
}

export function avancement(quete: Quete, stats: StatsDuJour): Avancement {
  const valeur = Math.min(stats[quete.mesure], quete.objectif)
  return { quete, valeur, faite: valeur >= quete.objectif }
}

/** Statistiques du jour à partir des activités enregistrées aujourd'hui. */
export function statsDuJour(
  activites: { type?: string; xp: number; bonnes: number; mauvaises: number; nouveaux: number }[],
  ecoutes: number,
): StatsDuJour {
  const compter = (t: string) => activites.filter((a) => (a.type ?? 'session') === t).length
  return {
    sessions: compter('session'),
    quiz: compter('quiz'),
    express: compter('express'),
    sons: compter('sons'),
    sansFaute: activites.filter((a) => a.mauvaises === 0 && a.bonnes > 0).length,
    xp: activites.reduce((t, a) => t + a.xp, 0),
    nouveaux: activites.reduce((t, a) => t + a.nouveaux, 0),
    ecoutes,
  }
}
