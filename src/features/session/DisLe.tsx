import { Ear, Loader2, Mic, RotateCcw, Square, Star, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { decoder16k, enregistrer, microDisponible, preparerMicro, referenceDuMot, rejouer, type Enregistrement } from '../../audio/micro'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { ajouterReglage, appreciation, decalageVoix, distanceEssai, scoreDeDistance } from '../../scoring/score'
import { Bouton } from '../../ui/Boutons'
import { BoutonAudio } from '../mots/BoutonAudio'

export interface ResultatDire {
  juste: boolean
  /** Score sur 100, ou null en auto-évaluation. */
  score: number | null
}

interface Props {
  mot: Mot
  /** Résultat prêt à valider (le bouton « Continuer » apparaît), ou null pendant un nouvel essai. */
  onPret: (r: ResultatDire | null) => void
  /** Auto-évaluation : la réponse est donnée tout de suite. */
  onRepondu: (r: ResultatDire) => void
}

type Etat =
  | { type: 'pret' }
  | { type: 'ecoute' }
  | { type: 'analyse' }
  | { type: 'muet' }
  | { type: 'resultat'; score: number; distance: number; son: Blob; corrige: boolean; regle: boolean }
  /** Pas de score possible (sans micro, micro refusé, pas de MP3 de référence) : l'utilisateur juge. */
  | { type: 'auto'; son: Blob | null; raison: string }

/** Dis-le : on écoute le mot, on le dit, et le score compare à la voix de Jamal. */
export function DisLe({ mot, onPret, onRepondu }: Props) {
  const profil = useProfil()
  const [etat, setEtat] = useState<Etat>({ type: 'pret' })
  const [niveau, setNiveau] = useState(0)
  const enCours = useRef<Enregistrement | null>(null)
  const avecMicro = profil.micro && microDisponible()

  useEffect(() => {
    jouer(mot.audio, mot.arabe)
    // Charge la référence pendant que l'utilisateur écoute.
    void referenceDuMot(mot.audio)
    return () => enCours.current?.arreter()
  }, [mot])

  async function parler() {
    if (enCours.current) {
      enCours.current.arreter()
      return
    }
    preparerMicro()
    onPret(null)
    const ref = await referenceDuMot(mot.audio)
    let e: Enregistrement
    try {
      e = await enregistrer(Math.max(3000, (ref?.duree ?? 1.5) * 2500 + 1000), setNiveau)
    } catch {
      setEtat({ type: 'auto', son: null, raison: 'Le micro n’est pas autorisé. Dis le mot à voix haute, puis juge toi-même.' })
      return
    }
    enCours.current = e
    setEtat({ type: 'ecoute' })
    const son = await e.fini
    enCours.current = null
    setEtat({ type: 'analyse' })
    if (!ref) {
      setEtat({ type: 'auto', son, raison: 'Pas de score pour ce mot (pas d’enregistrement de référence) : compare ton essai au modèle.' })
      return
    }
    try {
      const distance = distanceEssai(ref.empreinte, await decoder16k(await son.arrayBuffer()))
      if (distance === null) {
        setEtat({ type: 'muet' })
        return
      }
      const score = scoreDeDistance(distance, decalageVoix(profil.reglageVoix))
      setEtat({ type: 'resultat', score, distance, son, corrige: false, regle: false })
      onPret({ juste: appreciation(score).reussi, score })
      // « Presque » : le modèle est rejoué ; « À retravailler » : au ralenti.
      if (score < 80) window.setTimeout(() => jouer(mot.audio, mot.arabe, score < 60 ? 0.75 : 1), 600)
    } catch {
      setEtat({ type: 'auto', son, raison: 'Ton essai n’a pas pu être analysé : compare-le au modèle.' })
    }
  }

  function corriger() {
    if (etat.type !== 'resultat') return
    const corrige = !etat.corrige
    const reussi = appreciation(etat.score).reussi !== corrige
    // Un essai jugé bon par l'utilisateur règle le score sur sa voix (une seule fois par essai).
    const regler = corrige && reussi && !etat.regle
    if (regler) void modifierProfil({ reglageVoix: ajouterReglage(profil.reglageVoix, [etat.distance]) })
    setEtat({ ...etat, corrige, regle: etat.regle || regler })
    onPret({ juste: reussi, score: etat.score })
  }

  const enregistre = etat.type === 'ecoute'
  return (
    <div>
      <h2 className="t-titre-2">Dis-le</h2>
      <p className="t-appel mb-5 mt-1 text-texte-2">{avecMicro ? 'Écoute, puis prononce le mot.' : 'Écoute, puis dis le mot à voix haute.'}</p>
      <div className="mb-6 rounded-liste bg-carte px-marge py-5 text-center">
        <p className="t-titre-1">{mot.latin}</p>
        {profil.afficherArabe && (
          <p className="arabe mt-1 text-[2rem] leading-tight" dir="rtl" lang="ar">
            {mot.arabe}
          </p>
        )}
        <p className="t-sous-titre mt-1 text-texte-2">{mot.fr}</p>
        <div className="mt-4 flex gap-3">
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" />
          <BoutonAudio chemin={mot.audio} arabe={mot.arabe} vitesse={0.75} libelle="Ralenti" />
        </div>
      </div>

      {!avecMicro && etat.type !== 'auto' ? (
        <AutoEvaluation son={null} raison="Mode sans micro : dis le mot à voix haute, puis juge toi-même." mot={mot} onRepondu={onRepondu} />
      ) : etat.type === 'auto' ? (
        <AutoEvaluation son={etat.son} raison={etat.raison} mot={mot} onRepondu={onRepondu} />
      ) : etat.type === 'resultat' ? (
        <ResultatScore
          mot={mot}
          score={etat.score}
          corrige={etat.corrige}
          regle={profil.reglageVoix.length > 0}
          onMonEssai={() => rejouer(etat.son)}
          onModele={() => jouer(mot.audio, mot.arabe)}
          onReessayer={() => void parler()}
          onCorriger={corriger}
        />
      ) : (
        <div className="flex flex-col items-center" aria-live="polite">
          <button
            type="button"
            onClick={() => void parler()}
            disabled={etat.type === 'analyse'}
            aria-label={enregistre ? 'Arrêter l’enregistrement' : 'Parler'}
            className="pressable relative flex h-24 w-24 items-center justify-center rounded-full bg-accent-plein text-white"
          >
            {/* Halo qui suit le volume de la voix. */}
            <span
              className="absolute inset-0 rounded-full bg-accent-plein opacity-25 transition-transform duration-100"
              style={{ transform: `scale(${enregistre ? 1 + niveau * 0.6 : 1})` }}
              aria-hidden
            />
            {etat.type === 'analyse' ? (
              <Loader2 className="relative h-10 w-10 animate-spin" strokeWidth={2.2} aria-hidden />
            ) : enregistre ? (
              <Square className="relative h-8 w-8" fill="currentColor" strokeWidth={2} aria-hidden />
            ) : (
              <Mic className="relative h-10 w-10" strokeWidth={2.2} aria-hidden />
            )}
          </button>
          <p className="t-appel mt-3 text-texte-2">
            {etat.type === 'analyse'
              ? 'J’écoute ton essai…'
              : enregistre
                ? 'Je t’écoute… Touche pour arrêter.'
                : etat.type === 'muet'
                  ? 'Je n’ai rien entendu. Rapproche-toi du micro et réessaie.'
                  : 'Touche le micro et dis le mot.'}
          </p>
        </div>
      )}
    </div>
  )
}

function Etoiles({ n }: { n: number }) {
  return (
    <span className="flex justify-center gap-1" aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 3`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={`h-7 w-7 ${i <= n ? 'text-[#ffcc00]' : 'text-remplissage'}`} fill="currentColor" strokeWidth={0} aria-hidden />
      ))}
    </span>
  )
}

function ResultatScore(props: {
  mot: Mot
  score: number
  corrige: boolean
  regle: boolean
  onMonEssai: () => void
  onModele: () => void
  onReessayer: () => void
  onCorriger: () => void
}) {
  const a = appreciation(props.score)
  const reussi = a.reussi !== props.corrige
  const sons = a.reussi ? [] : sonsDuMot(props.mot.latin)
  return (
    <div className="text-center" aria-live="polite">
      <Etoiles n={a.etoiles} />
      <p className={`t-grand-titre mt-2 ${a.reussi ? 'text-vert' : 'text-rouge'}`}>
        {props.score}
        <span className="t-titre-3 text-texte-2"> / 100</span>
      </p>
      <p className="t-titre-3">{a.libelle}</p>
      {props.corrige && (
        <p className="t-sous-titre mt-1 text-texte-2">Corrigé par toi : {reussi ? 'compté comme réussi' : 'compté à retravailler'}.</p>
      )}
      {sons.map((s) => (
        <p key={s.latin} className="t-sous-titre mt-3 rounded-liste bg-carte px-marge py-3 text-left">
          <span className="font-semibold">
            {s.latin} · {s.arabe} :
          </span>{' '}
          {s.explication}
        </p>
      ))}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Bouton variante="teinte" onClick={props.onMonEssai}>
          <Ear className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Mon essai
        </Bouton>
        <Bouton variante="teinte" onClick={props.onModele}>
          <Volume2 className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Le modèle
        </Bouton>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Bouton variante="gris" onClick={props.onReessayer}>
          <RotateCcw className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Réessayer
        </Bouton>
        <button type="button" onClick={props.onCorriger} className="pressable t-appel min-h-11 text-accent">
          {props.corrige ? 'Annuler ma correction' : 'Le score se trompe'}
        </button>
      </div>
      {!props.regle && !a.reussi && (
        <p className="t-note mt-2 text-texte-2">Le score compare ta voix à celle de Jamal. Pour qu’il s’habitue à la tienne : Profil, « Régler le score sur ma voix ».</p>
      )}
    </div>
  )
}

function AutoEvaluation({ son, raison, mot, onRepondu }: { son: Blob | null; raison: string; mot: Mot; onRepondu: (r: ResultatDire) => void }) {
  return (
    <div className="text-center">
      <p className="t-appel mb-4 text-texte-2">{raison}</p>
      {son && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Bouton variante="teinte" onClick={() => rejouer(son)}>
            <Ear className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Mon essai
          </Bouton>
          <Bouton variante="teinte" onClick={() => jouer(mot.audio, mot.arabe)}>
            <Volume2 className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Le modèle
          </Bouton>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Bouton grand className="w-full !bg-vert-plein" onClick={() => onRepondu({ juste: true, score: null })}>
          Je l’ai bien dit
        </Bouton>
        <Bouton grand variante="gris" className="w-full" onClick={() => onRepondu({ juste: false, score: null })}>
          À retravailler
        </Bouton>
      </div>
    </div>
  )
}
