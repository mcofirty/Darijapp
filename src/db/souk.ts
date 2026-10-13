import { useLiveQuery } from 'dexie-react-hooks'
import { achatPossible, article, dirhamsGagnes, solde, type Categorie } from '../gamification/souk'
import { dateLocale } from '../srs/dates'
import { db, modifierProfil, type Achat, type DarijaDB } from './db'

/** Dirhams gagnés depuis le début, recalculés à partir des activités, théières et trésors. */
async function gagnes(base: DarijaDB): Promise<number> {
  const [sessions, theieres, tresors] = await Promise.all([
    base.sessions.toArray(),
    base.journal.filter((j) => j.coffre).count(),
    base.bonus.filter((b) => b.raison === 'tresor').count(),
  ])
  return dirhamsGagnes({ bonnes: sessions.reduce((t, s) => t + s.bonnes, 0), theieres, tresors })
}

export interface PorteMonnaie {
  solde: number
  achats: Achat[]
}

export async function lirePorteMonnaie(base: DarijaDB = db): Promise<PorteMonnaie> {
  const achats = await base.achats.toArray()
  return { solde: solde(await gagnes(base), achats), achats }
}

export function usePorteMonnaie(): PorteMonnaie {
  return useLiveQuery(() => lirePorteMonnaie(), []) ?? { solde: 0, achats: [] }
}

/** Achète un article et le met aussitôt en place ; renvoie un message d'erreur si l'achat est impossible. */
export async function acheter(id: string, base: DarijaDB = db): Promise<string | null> {
  const a = article(id)
  const erreur = await base.transaction('rw', [base.achats, base.sessions, base.journal, base.bonus], async () => {
    const { solde: s, achats } = await lirePorteMonnaie(base)
    const possible = achatPossible(id, s, achats)
    if (!possible.ok) return possible.raison
    await base.achats.add({ id, date: dateLocale(), prix: a!.prix })
    return null
  })
  if (!erreur && a) await choisir(a.categorie, id, base)
  return erreur
}

/** Met en place un article possédé (couleur, zellige ou pot). */
export async function choisir(categorie: Categorie, id: string, base: DarijaDB = db): Promise<void> {
  await modifierProfil({ [categorie]: id }, base)
}
