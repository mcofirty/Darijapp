import { useLiveQuery } from 'dexie-react-hooks'
import { Headphones, History, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { motsDuTheme } from '../../data'
import { THEMES } from '../../data/themes'
import type { Mot } from '../../data/types'
import { db, reglerMode } from '../../db/db'
import { useMots } from '../../db/motsPerso'
import { useModes } from '../../db/useProfil'
import { dureeApproximative, dureeEnMinutes, motsVusAEcouter, type OptionsEcoute } from '../../exercices/ecoute'
import { Bouton, Interrupteur, Vide } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { VISUELS_THEMES } from '../../ui/visuels'
import { LecteurEcoute } from './LecteurEcoute'

/** Écoute de ses mots les moins sus : de quoi tenir un trajet sans être interminable. */
const MOTS_A_REVOIR = 30

/** Mode écoute : choisir quoi écouter, puis lecteur mains libres. */
export function ModeEcoute({ onRetour }: { onRetour: () => void }) {
  const mots = useMots()
  const progressions = useLiveQuery(() => db.progression.toArray(), []) ?? []
  const [options, setOptions] = useState<OptionsEcoute>({ repeter: true, francais: true, phrases: false })
  const [ecoute, setEcoute] = useState<{ titre: string; mots: Mot[] } | null>(null)
  const sourd = useModes()?.ecouter === false

  const aRevoir = motsVusAEcouter(progressions, mots, MOTS_A_REVOIR)
  const tousVus = motsVusAEcouter(progressions, mots)
  const duree = (n: number) => `${n} mot${n > 1 ? 's' : ''} · ${dureeEnMinutes(dureeApproximative(n, options))}`

  if (ecoute) return <LecteurEcoute {...ecoute} options={options} onFermer={() => setEcoute(null)} />

  if (sourd)
    return (
      <Page titre="Mode écoute" retour={{ libelle: 'Apprendre', action: onRetour }}>
        <Vide
          icone={<VolumeX className="h-12 w-12" strokeWidth={1.8} aria-hidden />}
          titre="Exercices d’écoute coupés"
          texte="Le mode écoute lit tes mots à voix haute : réactive l’écoute pour l’utiliser."
        />
        <div className="text-center">
          <Bouton grand onClick={() => void reglerMode('ecouter', true)}>
            Réactiver l’écoute
          </Bouton>
        </div>
      </Page>
    )

  return (
    <Page titre="Mode écoute" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <p className="t-appel mb-6 px-marge text-texte-2">
        L'appli lit chaque mot en darija, te laisse le temps de le répéter à voix haute, puis donne la traduction. L'écran reste
        allumé pendant l'écoute.
      </p>

      <Section titre="Réglages">
        <Ligne
          titre="Répéter le darija au ralenti"
          fin={<Interrupteur actif={options.repeter} onChange={(v) => setOptions({ ...options, repeter: v })} libelle="Répéter le darija au ralenti" />}
        />
        <Ligne
          titre="Traduction en français"
          fin={<Interrupteur actif={options.francais} onChange={(v) => setOptions({ ...options, francais: v })} libelle="Traduction en français" />}
        />
        <Ligne
          titre="Phrases d’exemple à répéter"
          sousTitre="Chaque phrase deux fois, avec le temps de la redire"
          fin={<Interrupteur actif={!!options.phrases} onChange={(v) => setOptions({ ...options, phrases: v })} libelle="Phrases d’exemple à répéter" />}
        />
      </Section>

      <Section titre="Mes mots" note={tousVus.length === 0 ? 'Fais une première session pour écouter tes mots ici.' : undefined}>
        {tousVus.length > 0 && (
          <>
            <Ligne
              tuile={<Tuile icone={Headphones} couleur="#ff3b30" />}
              titre="À revoir en priorité"
              sousTitre={duree(aRevoir.length)}
              chevron
              onClick={() => setEcoute({ titre: 'À revoir en priorité', mots: aRevoir })}
            />
            <Ligne
              tuile={<Tuile icone={History} couleur="#007aff" />}
              titre="Tous mes mots vus"
              sousTitre={duree(tousVus.length)}
              chevron
              onClick={() => setEcoute({ titre: 'Tous mes mots vus', mots: tousVus })}
            />
          </>
        )}
      </Section>

      <Section titre="Par thème">
        {THEMES.map((t) => {
          const n = motsDuTheme(t.id).length
          return (
            <Ligne
              key={t.id}
              tuile={<Tuile {...VISUELS_THEMES[t.id]} />}
              titre={t.titre}
              sousTitre={duree(n)}
              chevron
              onClick={() => setEcoute({ titre: t.titre, mots: motsDuTheme(t.id) })}
            />
          )
        })}
      </Section>
    </Page>
  )
}
