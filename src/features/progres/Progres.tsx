import { BookOpen, Flame, Sparkles, Star, Trophy } from 'lucide-react'
import { useState } from 'react'
import { MOTS } from '../../data'
import type { Mot } from '../../data/types'
import { useResume } from '../../db/useResume'
import { Segmente } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { FicheMot } from '../mots/FicheMot'
import { Dictionnaire } from './Dictionnaire'

export function Progres() {
  const [vue, setVue] = useState<'tableau' | 'dictionnaire'>('tableau')
  const [mot, setMot] = useState<Mot | null>(null)
  const { niveau, xpTotal, xpAujourdhui, serie, sessionsAujourdhui, motsVus } = useResume()

  if (mot) return <FicheMot mot={mot} retour={{ libelle: 'Progrès', action: () => setMot(null) }} />

  return (
    <Page titre="Progrès">
      <div className="mb-6">
        <Segmente
          options={[
            { id: 'tableau', libelle: 'Tableau de bord' },
            { id: 'dictionnaire', libelle: 'Dictionnaire' },
          ]}
          valeur={vue}
          onChange={setVue}
        />
      </div>
      {vue === 'dictionnaire' ? (
        <Dictionnaire onChoisir={setMot} />
      ) : (
        <>
          <Section titre="Niveau">
            <Ligne
              tuile={<Tuile icone={Star} couleur="#ff9500" />}
              titre={
                <span className="block">
                  <span className="flex items-baseline justify-between">
                    <span>
                      Niveau {niveau.niveau} · <span className="font-semibold">{niveau.nom}</span>
                    </span>
                    <span className="t-sous-titre text-texte-2">
                      {niveau.objectif - niveau.xp} XP restants
                    </span>
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-remplissage" aria-hidden>
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(niveau.xp / niveau.objectif) * 100}%` }} />
                  </span>
                </span>
              }
            />
            <Ligne tuile={<Tuile icone={Trophy} couleur="#ffcc00" />} titre="XP au total" valeur={xpTotal} />
          </Section>
          <Section titre="Aujourd'hui">
            <Ligne tuile={<Tuile icone={Sparkles} couleur="#af52de" />} titre="XP du jour" valeur={xpAujourdhui} />
            <Ligne tuile={<Tuile icone={Flame} couleur="#ff3b30" />} titre="Série" valeur={`${serie.jours} jour${serie.jours > 1 ? 's' : ''}`} />
            <Ligne tuile={<Tuile icone={BookOpen} couleur="#007aff" />} titre="Sessions terminées" valeur={sessionsAujourdhui} />
          </Section>
          <Section titre="Vocabulaire" note="Les quêtes, le coffre et les statistiques détaillées arrivent au jalon 4.">
            <Ligne titre="Mots vus" valeur={`${motsVus.size} / ${MOTS.length}`} />
          </Section>
        </>
      )}
    </Page>
  )
}
