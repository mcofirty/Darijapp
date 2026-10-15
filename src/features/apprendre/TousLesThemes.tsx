import { Star } from 'lucide-react'
import { useState } from 'react'
import { chercherMots, motsDuTheme, normaliser } from '../../data'
import { THEMES } from '../../data/themes'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { useResume } from '../../db/useResume'
import { ETAPES } from '../../gamification/voyage'
import { ChampRecherche } from '../../ui/ChampRecherche'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { ListeMots } from '../mots/ListeMots'
import { CarreTheme } from './BlocsAccueil'

interface Props {
  favoris: number
  onRetour: () => void
  onTheme: (id: string) => void
  onFavoris: () => void
  onMot: (mot: Mot) => void
}

/** Les 31 thèmes en carrés (3 par ligne), rangés par étape du Parcours, avec les favoris et une recherche (thèmes et mots). */
export function TousLesThemes({ favoris, onRetour, onTheme, onFavoris, onMot }: Props) {
  const [requete, setRequete] = useState('')
  const { motsVus } = useResume()
  const MOTS = useMots()
  const q = normaliser(requete)

  /** Grille de thèmes en carrés, 3 par ligne. */
  function grille(ids: string[]) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {ids.map((id) => {
          const total = motsDuTheme(id).length
          const vus = motsDuTheme(id).filter((m) => motsVus.has(m.id)).length
          return <CarreTheme key={id} id={id} vus={vus} total={total} onClick={() => onTheme(id)} />
        })}
      </div>
    )
  }

  if (q) {
    const themes = THEMES.filter((t) => normaliser(t.titre).includes(q))
    const mots = chercherMots(MOTS, requete)
    return (
      <Page titre="Thèmes" retour={{ libelle: 'Apprendre', action: onRetour }}>
        <ChampRecherche valeur={requete} onChange={setRequete} placeholder="Thème ou mot" />
        {themes.length > 0 && (
          <section className="mb-[26px]">
            <h2 className="t-gras mb-2 px-marge text-texte-2">Thèmes</h2>
            {grille(themes.map((t) => t.id))}
          </section>
        )}
        <ListeMots mots={mots} onChoisir={onMot} titre={`${mots.length} mot${mots.length > 1 ? 's' : ''}`} />
      </Page>
    )
  }

  return (
    <Page titre="Thèmes" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <ChampRecherche valeur={requete} onChange={setRequete} placeholder="Thème ou mot" />
      <Section>
        <Ligne tuile={<Tuile icone={Star} couleur="#ffcc00" />} titre="Mes favoris" valeur={favoris} chevron onClick={onFavoris} />
      </Section>
      {/* Les thèmes rangés par étape du Parcours, en carrés, 3 par ligne. */}
      {ETAPES.map((e, i) => (
        <section key={e.id} className="mb-[26px]">
          <h2 className="t-gras mb-2 px-marge text-texte-2">
            {i + 1}. {e.ville} · {e.sujet}
          </h2>
          {grille(e.themes)}
        </section>
      ))}
    </Page>
  )
}
