import { Volume2 } from 'lucide-react'
import { useState } from 'react'
import essai from '../../../scripts/essai-voix.json'
import { useMots } from '../../db/motsPerso'
import { useProfil } from '../../db/useProfil'
import { Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'

const prets = new Set(__ESSAI_VOIX__)
let lecteur: HTMLAudioElement | null = null

function lire(chemin: string) {
  lecteur ??= new Audio()
  lecteur.pause()
  lecteur.src = import.meta.env.BASE_URL + chemin
  void lecteur.play().catch(() => {})
}

/**
 * Page cachée « …/Darijapp/#voix » : compare la voix actuelle (arabe sans voyelles) et la voix
 * qui lit le latin (scripts/voix.json), sur les mots de scripts/essai-voix.json.
 */
export function EssaiVoix() {
  const MOTS = useMots()
  const { afficherArabe } = useProfil()
  const [joue, setJoue] = useState<string | null>(null)
  const entrees = (essai as string[]).flatMap((audio) => {
    const mot = MOTS.find((m) => m.audio === audio)
    if (mot) return [{ audio, latin: mot.latin, arabe: mot.arabe, fr: mot.fr }]
    const avecExemple = MOTS.find((m) => m.exemple.audio === audio)
    return avecExemple ? [avecExemple.exemple] : []
  })
  const nom = (audio: string) => audio.replace(/^audio\//, '')
  const manquants = entrees.filter((e) => !prets.has(nom(e.audio))).length

  function bouton(chemin: string, cle: string, libelle: string, actif = true) {
    return (
      <button
        type="button"
        disabled={!actif}
        onClick={() => {
          setJoue(cle)
          lire(chemin)
        }}
        className={`pressable t-appel inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 font-semibold disabled:opacity-40 ${
          joue === cle ? 'bg-accent-plein text-white' : 'bg-accent-doux text-accent'
        }`}
      >
        <Volume2 className="h-4 w-4" strokeWidth={2.4} aria-hidden />
        {libelle}
      </button>
    )
  }

  return (
    <Page titre="Essai de voix">
      <p className="t-corps mb-[26px] px-1 text-texte-2">
        « Avant » : la voix actuelle, qui lit l’arabe sans voyelles. « Après » : la même voix, qui lit le latin (réécrit en arabe
        vocalisé, avec les consonnes lourdes de l’arabe). Écoute les deux et dis à Claude laquelle sonne le plus comme les gens
        parlent.
        {manquants > 0 && ` ${manquants} « Après » sont encore en cours de génération par l’Action « Audio ».`}
      </p>
      <Section>
        {entrees.map((e) => (
          <div key={e.audio} className="px-marge py-3">
            <p className="t-gras">
              {e.latin}
              {afficherArabe && (
                <span className="arabe ml-2 font-normal" lang="ar">
                  {e.arabe}
                </span>
              )}
            </p>
            <p className="t-sous-titre text-texte-2">{e.fr}</p>
            <div className="mt-2 flex gap-2">
              {bouton(e.audio, `${e.audio}:avant`, 'Avant')}
              {bouton(`audio/essai/${nom(e.audio)}`, `${e.audio}:apres`, 'Après', prets.has(nom(e.audio)))}
            </div>
          </div>
        ))}
      </Section>
    </Page>
  )
}
