import { Ear, Eye, Lightbulb, Loader2, Mic, RotateCcw, Square, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { modelePresent, noterParSons, ouvrirModele } from '../../audio/modeleSons'
import { SILENCE_MOT, SILENCE_PHRASE, decoder16k, enregistrer, microDisponible, preparerMicro, referenceDuMot, rejouer, type Enregistrement } from '../../audio/micro'
import { sonsDuMot } from '../../data/sons'
import type { Mot } from '../../data/types'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { indice } from '../../exercices/phrases'
import { PAUSE_MOT, PAUSE_PHRASE } from '../../scoring/mfcc'
import { ajouterReglage, appreciation, decalageVoix, distanceEssai, scoreDeDistance } from '../../scoring/score'
import { SEUIL_SON, sonRate, type DetailSon } from '../../scoring/sons/prononciation'
import { AnneauScore } from '../../ui/AnneauScore'
import { Bouton } from '../../ui/Boutons'
import { BoutonAudio } from '../mots/BoutonAudio'

export interface ResultatDire {
  juste: boolean
  /** Score sur 100, ou null en auto-évaluation. */
  score: number | null
}

/** Ce qui est à dire : un mot du programme, ou une phrase (exemple, réplique de dialogue, forme de grammaire). */
export type ADire = Pick<Mot, 'latin' | 'arabe' | 'fr' | 'audio'>

interface Props {
  mot: ADire
  /** « Dis-le en darija » : seul le français est montré ; le darija se dévoile après l'essai. */
  inverse?: boolean
  /** Une phrase : pauses entre les mots tolérées, enregistrement plus long. */
  phrase?: boolean
  /** Titre et consigne à la place de « Dis-le » (dialogues). */
  titre?: string
  consigne?: string
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
  | { type: 'resultat'; score: number; distance: number; son: Blob; corrige: boolean; regle: boolean; sons: DetailSon[] | null }
  /** Pas de score possible (sans micro, micro refusé, pas de MP3 de référence) : l'utilisateur juge. */
  | { type: 'auto'; son: Blob | null; raison: string }

/**
 * Dis-le : on écoute le mot, on le dit, et le score compare à la voix de Jamal.
 * En mode inverse, on part du français : rien n'est lu avant l'essai, un indice donne le début.
 */
export function DisLe({ mot, inverse = false, phrase = false, titre, consigne, onPret, onRepondu }: Props) {
  const profil = useProfil()
  const [etat, setEtat] = useState<Etat>({ type: 'pret' })
  const [niveau, setNiveau] = useState(0)
  // Mode inverse : 0 = français seul, 1 = indice (début du mot), 2 = darija montré.
  const [aide, setAide] = useState(0)
  const [devoile, setDevoile] = useState(!inverse)
  const enCours = useRef<Enregistrement | null>(null)
  const avecMicro = profil.micro && microDisponible()
  const pause = phrase ? PAUSE_PHRASE : PAUSE_MOT

  // Score précis : le modèle est ouvert dès l'arrivée sur l'exercice (quelques secondes au premier).
  useEffect(() => {
    if (!profil.scorePrecis) return
    void modelePresent().then((oui) => {
      if (oui) ouvrirModele().catch(() => {})
    })
  }, [profil.scorePrecis])

  useEffect(() => {
    if (!inverse) jouer(mot.audio, mot.arabe)
    // Charge la référence pendant que l'utilisateur écoute.
    void referenceDuMot(mot.audio, pause)
    return () => enCours.current?.arreter()
  }, [mot, inverse, pause])

  /** Mode inverse : le darija apparaît, et le modèle est lu. */
  function devoiler() {
    if (devoile) return
    setDevoile(true)
    window.setTimeout(() => jouer(mot.audio, mot.arabe), 400)
  }

  async function parler() {
    if (enCours.current) {
      enCours.current.arreter()
      return
    }
    preparerMicro()
    onPret(null)
    const ref = await referenceDuMot(mot.audio, pause)
    let e: Enregistrement
    try {
      e = phrase
        ? await enregistrer(Math.max(5000, (ref?.duree ?? 2.5) * 3000 + 2000), setNiveau, SILENCE_PHRASE)
        : await enregistrer(Math.max(3000, (ref?.duree ?? 1.5) * 2500 + 1000), setNiveau, SILENCE_MOT)
    } catch {
      setEtat({ type: 'auto', son: null, raison: 'Le micro n’est pas autorisé. Dis-le à voix haute, puis juge toi-même.' })
      devoiler()
      return
    }
    enCours.current = e
    setEtat({ type: 'ecoute' })
    const son = await e.fini
    enCours.current = null
    setEtat({ type: 'analyse' })
    if (!ref) {
      setEtat({ type: 'auto', son, raison: 'Pas de score ici (pas d’enregistrement de référence) : compare ton essai au modèle.' })
      devoiler()
      return
    }
    try {
      const essai = await decoder16k(await son.arrayBuffer())
      const distance = distanceEssai(ref.empreinte, essai, pause)
      if (distance === null) {
        setEtat({ type: 'muet' })
        return
      }
      let score = scoreDeDistance(distance, decalageVoix(profil.reglageVoix))
      let sons: DetailSon[] | null = null
      // Score précis : chaque son du mot, comparé à ce que le modèle entend chez Jamal ; sinon, le score acoustique.
      if (profil.scorePrecis && (await modelePresent())) {
        try {
          const e = await noterParSons(mot.audio, ref.signal, essai, mot.latin)
          score = e.score
          sons = e.details
        } catch {
          // Modèle impossible à ouvrir (mémoire) : on garde le score acoustique.
        }
      }
      setEtat({ type: 'resultat', score, distance, son, corrige: false, regle: false, sons })
      onPret({ juste: appreciation(score).reussi, score })
      // Mode inverse : le darija se dévoile avec le modèle. Sinon, « Presque » : le modèle est rejoué ;
      // « À retravailler » : au ralenti.
      if (!devoile) {
        setDevoile(true)
        window.setTimeout(() => jouer(mot.audio, mot.arabe, score < 60 ? 0.75 : 1), 600)
      } else if (score < 80) window.setTimeout(() => jouer(mot.audio, mot.arabe, score < 60 ? 0.75 : 1), 600)
    } catch {
      setEtat({ type: 'auto', son, raison: 'Ton essai n’a pas pu être analysé : compare-le au modèle.' })
      devoiler()
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
  const cible = phrase ? 'la phrase' : 'le mot'
  const montre = devoile || aide === 2
  return (
    <div>
      <h2 className="t-titre-2">{titre ?? (inverse ? 'Dis-le en darija' : 'Dis-le')}</h2>
      <p className="t-appel mb-5 mt-1 text-texte-2">
        {consigne ??
          (inverse
            ? 'Comment dit-on en darija ? Dis-le à voix haute.'
            : avecMicro
              ? `Écoute, puis prononce ${cible}.`
              : `Écoute, puis dis ${cible} à voix haute.`)}
      </p>
      <div className="mb-6 rounded-liste bg-carte px-marge py-5 text-center">
        {inverse && <p className="t-titre-2 mb-3">{mot.fr}</p>}
        {montre ? (
          <>
            <p className={phrase ? 't-titre-2' : 't-titre-1'}>{mot.latin}</p>
            {profil.afficherArabe && (
              <p className={`arabe mt-1 leading-tight ${phrase ? 'text-[1.6rem]' : 'text-[2rem]'}`} dir="rtl" lang="ar">
                {mot.arabe}
              </p>
            )}
            {!inverse && <p className="t-sous-titre mt-1 text-texte-2">{mot.fr}</p>}
          </>
        ) : (
          aide === 1 && <p className="t-titre-2 text-texte-2">{indice(mot.latin)}</p>
        )}
        {devoile ? (
          <div className="mt-4 flex gap-3">
            <BoutonAudio chemin={mot.audio} arabe={mot.arabe} libelle="Écouter" />
            <BoutonAudio chemin={mot.audio} arabe={mot.arabe} vitesse={0.75} libelle="Ralenti" />
          </div>
        ) : (
          aide < 2 && (
            <Bouton variante="teinte" className="mt-4" onClick={() => setAide(aide + 1)}>
              <Lightbulb className="h-5 w-5" strokeWidth={2.4} aria-hidden /> {aide === 0 ? 'Indice' : 'Voir le darija'}
            </Bouton>
          )
        )}
      </div>

      {!avecMicro && etat.type !== 'auto' ? (
        devoile ? (
          <AutoEvaluation son={null} raison={`Mode sans micro : dis ${cible} à voix haute, puis juge toi-même.`} mot={mot} onRepondu={onRepondu} />
        ) : (
          <div className="text-center">
            <p className="t-appel mb-4 text-texte-2">Dis-le à voix haute, puis regarde la réponse.</p>
            <Bouton grand className="w-full" onClick={devoiler}>
              <Eye className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Montrer la réponse
            </Bouton>
          </div>
        )
      ) : etat.type === 'auto' ? (
        <AutoEvaluation son={etat.son} raison={etat.raison} mot={mot} onRepondu={onRepondu} />
      ) : etat.type === 'resultat' ? (
        <ResultatScore
          mot={mot}
          score={etat.score}
          sons={etat.sons}
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
              ? profil.scorePrecis
                ? 'J’écoute chaque son… (quelques secondes)'
                : 'J’écoute ton essai…'
              : enregistre
                ? 'Je t’écoute… Touche pour arrêter.'
                : etat.type === 'muet'
                  ? 'Je n’ai rien entendu. Rapproche-toi du micro et réessaie.'
                  : `Touche le micro et dis ${cible}.`}
          </p>
        </div>
      )}
    </div>
  )
}

function ResultatScore(props: {
  mot: ADire
  score: number
  sons: DetailSon[] | null
  corrige: boolean
  regle: boolean
  onMonEssai: () => void
  onModele: () => void
  onReessayer: () => void
  onCorriger: () => void
}) {
  const a = appreciation(props.score)
  const reussi = a.reussi !== props.corrige
  // Explications des sons du darija : ceux ratés (score précis), sinon tous ceux du mot quand c'est raté.
  const rates = new Set(a.reussi ? [] : props.sons?.filter(sonRate).map((d) => d.latin))
  const sons = props.sons ? sonsDuMot(props.mot.latin).filter((s) => rates.has(s.latin)) : a.reussi ? [] : sonsDuMot(props.mot.latin)
  return (
    <div className="text-center" aria-live="polite">
      <AnneauScore score={props.score} />
      <p className="t-titre-3 mt-2">{a.libelle}</p>
      {props.corrige && (
        <p className="t-sous-titre mt-1 text-texte-2">Corrigé par toi : {reussi ? 'compté comme réussi' : 'compté à retravailler'}.</p>
      )}
      {props.sons && <SonParSon sons={props.sons} />}
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
      {!props.sons && !props.regle && !a.reussi && (
        <p className="t-note mt-2 text-texte-2">Le score compare ta voix à celle de Jamal. Pour qu’il s’habitue à la tienne : Profil, « Régler le score sur ma voix ».</p>
      )}
    </div>
  )
}

/** Couleur d'un son selon sa ressemblance avec la référence. */
function teinteSon(d: DetailSon): string {
  if (d.probabilite >= 0.85) return 'bg-vert-doux text-vert'
  if (d.probabilite >= SEUIL_SON) return 'bg-[color-mix(in_srgb,#ff9500_18%,transparent)] text-[#c76a00] dark:text-[#ffb340]'
  return 'bg-rouge-doux text-rouge'
}

/** Confusions courantes des sons du darija : seules celles-ci sont nommées (les autres sont du bruit du modèle). */
const VOISINS: Record<string, string[]> = {
  '7': ['h', 'kh', '3', 'a'],
  '3': ['a', 'hamza', '7'],
  '9': ['k', 'g', 'gh', 'kh'],
  kh: ['k', 'h', 'gh', '9', '7'],
  gh: ['r', 'kh', '9', 'g'],
}

/** Score précis : chaque son du mot en pastille colorée ; pour les sons du darija ratés, ce que le modèle a entendu. */
function SonParSon({ sons }: { sons: DetailSon[] }) {
  const rates = sons.filter((d) => d.special && d.probabilite < SEUIL_SON)
  return (
    <div className="mt-3">
      <p className="flex flex-wrap justify-center gap-1.5" aria-label="Son par son">
        {sons.map((d, i) => (
          <span key={i} className={`t-gras rounded-reponse px-2.5 py-1 ${d.voyelle ? 'opacity-70' : ''} ${teinteSon(d)}`}>
            {d.latin}
          </span>
        ))}
      </p>
      {rates.map((d, i) => (
        <p key={i} className="t-sous-titre mt-2 text-texte-2">
          Ton <span className="font-semibold text-texte">{d.latin}</span> :{' '}
          {d.confondu === null
            ? 'je ne l’entends presque pas.'
            : VOISINS[d.latin]?.includes(d.confondu)
              ? `on entend plutôt un « ${d.confondu} ».`
              : 'il ne sonne pas encore comme celui de Jamal.'}
        </p>
      ))}
    </div>
  )
}

function AutoEvaluation({ son, raison, mot, onRepondu }: { son: Blob | null; raison: string; mot: ADire; onRepondu: (r: ResultatDire) => void }) {
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
