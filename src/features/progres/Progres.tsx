import { BookOpen, Sparkles, Star, Trophy } from 'lucide-react'
import { useState } from 'react'
import type { Mot } from '../../data/types'
import { useMots } from '../../db/motsPerso'
import { useResume } from '../../db/useResume'
import { Segmente } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { ContenuJardin } from '../jeu/MonJardin'
import { Souk } from '../jeu/Souk'
import { Badges, Collection, Semaine } from '../jeu/Tableau'
import { DefisReussis } from '../jeu/Motivation'
import { QuetesDuJour } from '../jeu/QuetesDuJour'
import { FicheMot } from '../mots/FicheMot'
import { Dictionnaire } from './Dictionnaire'

export function Progres() {
  const [vue, setVue] = useState<'tableau' | 'dictionnaire' | 'jardin'>('tableau')
  const [mot, setMot] = useState<Mot | null>(null)
  const [souk, setSouk] = useState(false)
  const { niveau, xpTotal, xpAujourdhui, sessionsAujourdhui, motsVus } = useResume()
  const MOTS = useMots()

  if (mot) return <FicheMot mot={mot} retour={{ libelle: 'Progrès', action: () => setMot(null) }} />
  if (souk) return <Souk retour={{ libelle: 'Progrès', action: () => setSouk(false) }} />

  function ouvrirJardin() {
    setVue('jardin')
    window.scrollTo(0, 0)
  }

  return (
    <Page titre="Progrès">
      <div className="mb-6">
        <Segmente
          options={[
            { id: 'tableau', libelle: 'Tableau de bord' },
            { id: 'dictionnaire', libelle: 'Dictionnaire' },
            { id: 'jardin', libelle: 'Mon jardin' },
          ]}
          valeur={vue}
          onChange={setVue}
        />
      </div>
      {vue === 'dictionnaire' ? (
        <Dictionnaire onChoisir={setMot} />
      ) : vue === 'jardin' ? (
        <ContenuJardin
          onSouk={() => {
            setSouk(true)
            window.scrollTo(0, 0)
          }}
        />
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
              chevron
              onClick={ouvrirJardin}
            />
            <Ligne tuile={<Tuile icone={Trophy} couleur="#ffcc00" />} titre="XP au total" valeur={xpTotal} />
          </Section>
          <Semaine />
          <Section titre="Aujourd'hui">
            <Ligne tuile={<Tuile icone={Sparkles} couleur="#af52de" />} titre="XP du jour" valeur={xpAujourdhui} />
            <Ligne tuile={<Tuile icone={BookOpen} couleur="#007aff" />} titre="Activités terminées" valeur={sessionsAujourdhui} />
          </Section>
          <QuetesDuJour />
          <Collection />
          <DefisReussis />
          <Badges />
          <Section titre="Vocabulaire">
            <Ligne titre="Mots vus" valeur={`${motsVus.size} / ${MOTS.length}`} />
          </Section>
        </>
      )}
    </Page>
  )
}
