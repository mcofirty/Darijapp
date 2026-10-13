import { CircleCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { decoder16k, enregistrer, microDisponible, preparerMicro, referenceDuMot, type Enregistrement } from '../../audio/micro'
import { MOTS_SONS } from '../../data/pairesSons'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { decalageVoix, distanceEssai } from '../../scoring/score'
import { BoutonMicro } from '../../ui/BoutonMicro'
import { Bouton } from '../../ui/Boutons'
import { Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { BoutonAudio } from '../mots/BoutonAudio'

/** Mots simples, sans son difficile : l'écart mesuré vient de la voix, pas d'une erreur. */
const MOTS_REGLAGE = ['son-la', 'son-kima', 'son-kass', 'son-hal']
  .map((id) => MOTS_SONS.find((m) => m.id === id))
  .filter((m) => m !== undefined)

/** Au-delà, l'essai ressemble plus à un autre mot (ou à un bruit) qu'à une autre voix : on le redemande une fois. */
const DISTANCE_SUSPECTE = 2.9

/**
 * Régler le score sur ma voix : l'utilisateur répète 4 mots faciles après Jamal ;
 * l'écart typique entre sa voix et celle de Jamal décale ensuite le barème.
 */
export function ReglageVoix({ onRetour }: { onRetour: () => void }) {
  const profil = useProfil()
  const [index, setIndex] = useState(0)
  const [distances, setDistances] = useState<number[]>([])
  const [etat, setEtat] = useState<'pret' | 'ecoute' | 'analyse' | 'muet' | 'douteux' | 'erreur'>('pret')
  const [niveau, setNiveau] = useState(0)
  const enCours = useRef<Enregistrement | null>(null)
  const fini = index >= MOTS_REGLAGE.length
  const mot = MOTS_REGLAGE[Math.min(index, MOTS_REGLAGE.length - 1)]

  useEffect(() => {
    if (fini) return
    jouer(mot.audio, mot.arabe)
    void referenceDuMot(mot.audio)
  }, [mot, fini])
  useEffect(() => () => enCours.current?.arreter(), [])

  async function parler() {
    if (enCours.current) {
      enCours.current.arreter()
      return
    }
    preparerMicro()
    try {
      const ref = await referenceDuMot(mot.audio)
      if (!ref) throw new Error('référence')
      const e = await enregistrer(4000, setNiveau)
      enCours.current = e
      setEtat('ecoute')
      const son = await e.fini
      enCours.current = null
      setEtat('analyse')
      const d = distanceEssai(ref.empreinte, await decoder16k(await son.arrayBuffer()))
      if (d === null) {
        setEtat('muet')
        return
      }
      if (d > DISTANCE_SUSPECTE && etat !== 'douteux') {
        setEtat('douteux')
        return
      }
      const toutes = [...distances, d]
      setDistances(toutes)
      setEtat('pret')
      setIndex(index + 1)
      if (toutes.length === MOTS_REGLAGE.length) void modifierProfil({ reglageVoix: toutes })
    } catch {
      enCours.current = null
      setEtat('erreur')
    }
  }

  const ecoute = etat === 'ecoute'
  return (
    <Page titre="Régler le score" retour={{ libelle: 'Profil', action: onRetour }}>
      <p className="t-corps mb-[26px] px-1 text-texte-2">
        Le score compare ta voix à celle de Jamal. Répète ces {MOTS_REGLAGE.length} mots faciles après lui : le score saura ce qui vient de ta voix, et
        jugera mieux les sons difficiles. Tout reste sur ton iPhone.
      </p>
      {!microDisponible() ? (
        <p className="t-corps rounded-liste bg-carte p-marge">Le micro n’est pas disponible sur cet appareil.</p>
      ) : fini ? (
        <section className="rounded-carte bg-carte p-marge text-center">
          <CircleCheck className="mx-auto h-12 w-12 text-vert" strokeWidth={2.2} aria-hidden />
          <p className="t-titre-2 mt-2">Score réglé sur ta voix</p>
          <p className="t-sous-titre mt-1 text-texte-2">
            {decalageVoix(distances) > 0 ? 'Le barème tient maintenant compte de ta voix.' : 'Ta voix est proche de celle de Jamal : le barème ne change pas.'}
          </p>
          <Bouton grand className="mt-4 w-full" onClick={onRetour}>
            Terminé
          </Bouton>
        </section>
      ) : (
        <section className="rounded-carte bg-carte p-marge text-center">
          <p className="t-note font-semibold uppercase text-accent">
            Mot {index + 1} sur {MOTS_REGLAGE.length}
          </p>
          <p className="t-titre-1 mt-1">{mot.latin}</p>
          {profil.afficherArabe && (
            <p className="arabe text-[1.8rem]" dir="rtl" lang="ar">
              {mot.arabe}
            </p>
          )}
          <p className="t-sous-titre text-texte-2">{mot.fr}</p>
          <div className="my-4 flex justify-center">
            <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" />
          </div>
          <div className="flex justify-center">
            <BoutonMicro etat={etat === 'analyse' ? 'analyse' : ecoute ? 'ecoute' : 'pret'} niveau={niveau} taille="h-20 w-20" onClick={() => void parler()} />
          </div>
          <p className="t-appel mt-3 text-texte-2" aria-live="polite">
            {ecoute
              ? 'Je t’écoute…'
              : etat === 'muet'
                ? 'Je n’ai rien entendu. Réessaie un peu plus fort.'
                : etat === 'douteux'
                  ? 'Je n’ai pas bien reconnu le mot. Réécoute-le et réessaie.'
                  : etat === 'erreur'
                    ? 'Le micro ou l’enregistrement de Jamal n’est pas disponible (hors ligne ?).'
                    : 'Touche le micro et répète le mot.'}
          </p>
        </section>
      )}
      {profil.reglageVoix.length > 0 && !fini && (
        <Section>
          <button type="button" onClick={() => void modifierProfil({ reglageVoix: [] })} className="pressable t-corps min-h-ligne w-full px-marge text-left text-rouge">
            Effacer le réglage actuel
          </button>
        </Section>
      )}
    </Page>
  )
}
