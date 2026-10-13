import { useLiveQuery } from 'dexie-react-hooks'
import { BADGES, avancementBadge, badgeObtenu, compterCollection, maitrise, type Badge, type Maitrise, type StatsBadges } from '../gamification/collection'
import { SCENES, aDire } from '../exercices/dialogues'
import { etatsDuVoyage } from '../gamification/voyage'
import { niveauDepuisXp } from '../gamification/xp'
import { lireXpTotal } from './apprentissage'
import { tousLesMots } from './motsPerso'
import { avancement, quetesDuJour, statsDuJour, type Avancement } from '../gamification/quetes'
import { meilleureSerie, septDerniersJours, type JourSemaine } from '../gamification/serie'
import { dateLocale } from '../srs/dates'
import { db, lireProfil } from './db'
import { lireJournal } from './journal'
import { couverts } from './serie'

export interface Jeu {
  quetes: Avancement[]
  coffreOuvert: boolean
  semaine: JourSemaine[]
  collection: Record<Maitrise, number>
  /** Chaque badge, obtenu ou non, avec la mesure actuelle et l'avancée (0 à 1). */
  badges: { badge: Badge; obtenu: boolean; valeur: number; avancement: number }[]
}

const VIDE: Jeu = { quetes: [], coffreOuvert: false, semaine: [], collection: { bronze: 0, argent: 0, or: 0 }, badges: [] }

/** Quêtes du jour, théière, semaine, collection et badges, mis à jour en direct. */
export function useJeu(): Jeu {
  return (
    useLiveQuery(async () => {
      const aujourdhui = dateLocale()
      const [sessions, journal, progressions, profil, xpTotal, journaux, achats, motsAjoutes, mots] = await Promise.all([
        db.sessions.toArray(),
        lireJournal(aujourdhui),
        db.progression.toArray(),
        lireProfil(),
        lireXpTotal(),
        db.journal.toArray(),
        db.achats.count(),
        db.motsPerso.count(),
        tousLesMots(),
      ])
      const dates = sessions.map((s) => s.date)
      const stats = statsDuJour(
        sessions.filter((s) => s.date === aujourdhui),
        journal.ecoutes,
      )
      const collection = compterCollection(progressions)
      const scores = progressions.flatMap((p) => p.scores ?? [])
      const compter = (type: string) => sessions.filter((s) => s.type === type).length
      const statsBadges: StatsBadges = {
        motsVus: progressions.length,
        motsArgent: collection.argent + collection.or,
        motsOr: collection.or,
        meilleureSerie: meilleureSerie(dates),
        activites: sessions.length,
        sansFaute: sessions.filter((s) => s.mauvaises === 0 && s.bonnes > 0).length,
        recordExpress: profil.recordExpress,
        recordSons: profil.recordSons,
        niveau: niveauDepuisXp(xpTotal).niveau,
        xpTotal,
        excellents: scores.filter((n) => n >= 80).length,
        parfaits: scores.filter((n) => n >= 100).length,
        dialogues: Object.keys(profil.dialogues).length,
        dialoguesParfaits: SCENES.filter((sc) => (profil.dialogues[sc.id] ?? -1) >= aDire(sc)).length,
        grammaire: compter('grammaire'),
        marchandages: compter('marchandage'),
        taxis: compter('taxi'),
        tampons: etatsDuVoyage(mots, progressions).filter((e) => e.tampon).length,
        theieres: journaux.filter((j) => j.coffre).length,
        achats,
        motsAjoutes,
      }
      return {
        quetes: quetesDuJour(aujourdhui).map((q) => avancement(q, stats)),
        coffreOuvert: journal.coffre,
        semaine: septDerniersJours(dates, aujourdhui, couverts(profil)),
        collection,
        badges: BADGES.map((badge) => ({
          badge,
          obtenu: badgeObtenu(badge, statsBadges),
          valeur: statsBadges[badge.mesure],
          avancement: avancementBadge(badge, statsBadges),
        })),
      }
    }, []) ?? VIDE
  )
}

/** Niveau de maîtrise de chaque mot vu (bronze, argent, or), par identifiant. */
export function useMaitrises(): Map<string, Maitrise> {
  const progressions = useLiveQuery(() => db.progression.toArray(), [])
  return new Map((progressions ?? []).map((p) => [p.id, maitrise(p.boite)]))
}

/** Boîte de répétition espacée de chaque mot vu (force du mot), par identifiant. */
export function useBoites(): Map<string, number> {
  const progressions = useLiveQuery(() => db.progression.toArray(), [])
  return new Map((progressions ?? []).map((p) => [p.id, p.boite]))
}
