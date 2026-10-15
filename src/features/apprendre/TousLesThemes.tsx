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
import { VISUELS_THEMES } from '../../ui/visuels'
import { ListeMots } from '../mots/ListeMots'

interface Props {
  favoris: number
  onRetour: () => void
  onTheme: (id: string) => void
  onFavoris: () => void
  onMot: (mot: Mot) => void
}

/** Les 31 thèmes rangés par étape du Parcours, avec les favoris et une recherche (thèmes et mots). */
export function TousLesThemes({ favoris, onRetour, onTheme, onFavoris, onMot }: Props) {
  const [requete, setRequete] = useState('')
  const { motsVus } = useResume()
  const MOTS = useMots()
  const q = normaliser(requete)

  function ligne(id: string) {
    const theme = THEMES.find((t) => t.id === id)
    if (!theme) return null
    const mots = motsDuTheme(id)
    const vus = mots.filter((m) => motsVus.has(m.id)).length
    return (
      <Ligne
        key={id}
        tuile={<Tuile {...VISUELS_THEMES[id]} />}
        titre={theme.titre}
        valeur={vus > 0 ? `${vus}/${mots.length}` : mots.length}
        chevron
        onClick={() => onTheme(id)}
      />
    )
  }

  if (q) {
    const themes = THEMES.filter((t) => normaliser(t.titre).includes(q))
    const mots = chercherMots(MOTS, requete)
    return (
      <Page titre="Thèmes" retour={{ libelle: 'Apprendre', action: onRetour }}>
        <ChampRecherche valeur={requete} onChange={setRequete} placeholder="Thème ou mot" />
        {themes.length > 0 && <Section titre="Thèmes">{themes.map((t) => ligne(t.id))}</Section>}
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
      {ETAPES.map((e, i) => (
        <Section key={e.id} titre={`${i + 1}. ${e.ville} · ${e.sujet}`}>
          {e.themes.map(ligne)}
        </Section>
      ))}
    </Page>
  )
}
