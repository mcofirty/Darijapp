import { CircleCheck, CircleX, MessagesSquare, Play, Square, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { arreterLecture, jouer, lireEtAttendre } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { enregistrerActivite, type BilanSession } from '../../db/apprentissage'
import { couperUnMoment, modifierProfil } from '../../db/db'
import { useModes, useProfil } from '../../db/useProfil'
import { SCENES, aDire, meilleurResultat, propositionsReplique, repliquesDe, type Scene } from '../../exercices/dialogues'
import { Alerte } from '../../ui/Alerte'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { Bilan } from '../session/Bilan'
import { Choix } from '../session/Choix'
import { DisLe, type ResultatDire } from '../session/DisLe'

/** Couleurs des tuiles des scènes, dans l'ordre. */
const COULEURS = ['#a2845e', '#ffcc00', '#34c759', '#ff2d55', '#007aff', '#ff9500', '#30b0c7', '#5856d6']

/** Liste des dialogues, puis une scène : écoute, puis « Joue ton rôle ». */
export function Dialogues({ onRetour }: { onRetour: () => void }) {
  const [enCours, setEnCours] = useState<{ scene: Scene; numero: number } | null>(null)
  const { dialogues } = useProfil()

  if (enCours)
    return (
      <Dialogue
        key={enCours.numero}
        scene={enCours.scene}
        onFermer={() => setEnCours(null)}
        onEncore={() => setEnCours((e) => e && { scene: e.scene, numero: e.numero + 1 })}
      />
    )

  return (
    <Page titre="Dialogues" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <Section note="Écoute la scène, puis joue ton rôle : l’autre personnage parle, tu réponds en darija à partir du français.">
        {SCENES.map((s, i) => {
          const meilleur = dialogues[s.id]
          return (
            <Ligne
              key={s.id}
              tuile={<Tuile icone={MessagesSquare} couleur={COULEURS[i % COULEURS.length]} />}
              titre={s.titre}
              sousTitre={s.contexte}
              valeur={meilleur !== undefined ? `${meilleur}/${aDire(s)}` : undefined}
              chevron
              onClick={() => setEnCours((e) => ({ scene: s, numero: (e?.numero ?? 0) + 1 }))}
            />
          )
        })}
      </Section>
    </Page>
  )
}

type Phase = 'ecoute' | 'jeu' | 'fin'

/** Une scène en plein écran : on l'écoute en entier, puis on dit ses répliques avec Dis-le. */
function Dialogue({ scene, onFermer, onEncore }: { scene: Scene; onFermer: () => void; onEncore: () => void }) {
  const profil = useProfil()
  const repliques = useMemo(() => repliquesDe(scene, profil.genre), [scene, profil.genre])
  const [phase, setPhase] = useState<Phase>('ecoute')
  // Pendant le jeu : index de la réplique à dire.
  const [index, setIndex] = useState(() => repliques.findIndex((r) => r.qui === 'moi'))
  const [dire, setDire] = useState<ResultatDire | null>(null)
  const [enLecture, setEnLecture] = useState<number | null>(null)
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  // Sans parler (réglage, pause, ou « Je ne peux pas parler maintenant ») : on choisit sa réplique.
  const modes = useModes()
  const [sansParler, setSansParler] = useState(false)
  const parle = (modes?.parler ?? true) && !sansParler
  const ecoute = modes?.ecouter ?? true
  const score = useRef({ bonnes: 0, mauvaises: 0 })
  const resultats = useRef(new Map<number, boolean>())
  const lecture = useRef(0)
  const bas = useRef<HTMLDivElement>(null)

  /** Lit les répliques de `debut` à `fin` (exclue) l'une après l'autre ; une autre lecture l'interrompt. */
  async function lireSuite(debut: number, fin: number) {
    const jeton = ++lecture.current
    for (let i = debut; i < fin; i++) {
      if (lecture.current !== jeton) return
      setEnLecture(i)
      await lireEtAttendre(repliques[i].audio, repliques[i].arabe)
      await new Promise((r) => setTimeout(r, 350))
    }
    if (lecture.current === jeton) setEnLecture(null)
  }

  function arreter() {
    lecture.current++
    arreterLecture()
    setEnLecture(null)
  }

  useEffect(() => () => void lecture.current++, [])

  // En jeu, les répliques de l'autre personnage qui viennent d'apparaître (depuis ma dernière réplique)
  // sont lues, puis on fait défiler vers le bas.
  useEffect(() => {
    if (phase === 'ecoute') return
    const fin = phase === 'fin' ? repliques.length : index
    if (ecoute) void lireSuite(precedenteDite(fin) + 1, fin)
    window.setTimeout(() => bas.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
  }, [phase, index])

  /** Index de la dernière réplique dite par l'utilisateur avant `i` (-1 s'il n'y en a pas). */
  function precedenteDite(i: number): number {
    for (let j = i - 1; j >= 0; j--) if (repliques[j].qui === 'moi') return j
    return -1
  }

  function commencer() {
    arreter()
    setPhase(index < 0 ? 'fin' : 'jeu')
  }

  function valider(r: ResultatDire) {
    resultats.current.set(index, r.juste)
    score.current[r.juste ? 'bonnes' : 'mauvaises']++
    sonReponse(r.juste)
    setDire(null)
    const suivante = repliques.findIndex((x, i) => i > index && x.qui === 'moi')
    if (suivante < 0) setPhase('fin')
    else setIndex(suivante)
  }

  async function terminer() {
    arreter()
    const { bonnes } = score.current
    await modifierProfil({ dialogues: meilleurResultat(profil.dialogues, scene.id, bonnes) })
    setBilan(await enregistrerActivite('dialogue', score.current))
  }

  // Sans parler : les répliques proposées pour celle à dire, tirées une fois par réplique.
  const choix = useMemo(
    () => (phase === 'jeu' && repliques[index] ? propositionsReplique(repliques[index], scene, profil.genre) : null),
    [phase, index, repliques, scene, profil.genre],
  )

  if (bilan) {
    const { bonnes, mauvaises } = score.current
    return (
      <Bilan
        titre={mauvaises === 0 ? 'Sans faute !' : 'Dialogue terminé'}
        sousTitre={`${bonnes} réplique${bonnes > 1 ? 's' : ''} réussie${bonnes > 1 ? 's' : ''} sur ${bonnes + mauvaises}`}
        xp={bilan.xp}
        activite={bilan}
        taux={bonnes / Math.max(1, bonnes + mauvaises)}
        libelleEncore="Rejouer la scène"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    )
  }

  const visibles = phase === 'ecoute' ? repliques : repliques.slice(0, phase === 'fin' ? repliques.length : index)
  const actuelle = phase === 'jeu' ? repliques[index] : null
  const nbADire = aDire(scene)
  const faites = score.current.bonnes + score.current.mauvaises

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={() => (phase === 'ecoute' ? (arreter(), onFermer()) : setConfirmer(true))}
          aria-label="Quitter le dialogue"
          className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <div className="verre verre-fin flex h-11 flex-1 items-center rounded-full px-4">
          {phase === 'ecoute' ? (
            <p className="t-appel flex-1 truncate text-center font-semibold">{scene.titre}</p>
          ) : (
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(faites / nbADire) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-2">
        <div className="mb-5 rounded-liste bg-carte px-marge py-4">
          <p className="t-titre-3">{phase === 'ecoute' ? 'Écoute la scène' : 'Joue ton rôle'}</p>
          <p className="t-sous-titre mt-1 text-texte-2">
            {scene.contexte}{' '}
            {phase === 'ecoute'
              ? 'Touche une réplique pour la réécouter.'
              : parle
                ? `${scene.autre} te parle : réponds en darija.`
                : `${scene.autre} te parle : choisis ta réponse en darija.`}
          </p>
        </div>

        <ul className="space-y-3">
          {visibles.map((r, i) => (
            <Bulle
              key={r.id}
              moi={r.qui === 'moi'}
              nom={r.qui === 'moi' ? 'Toi' : scene.autre}
              latin={r.latin}
              arabe={profil.afficherArabe ? r.arabe : null}
              fr={r.fr}
              active={enLecture === i}
              resultat={phase !== 'ecoute' ? resultats.current.get(i) : undefined}
              onToucher={() => {
                arreter()
                jouer(r.audio, r.arabe)
              }}
            />
          ))}
        </ul>

        {actuelle && !parle && choix && (
          <div key={index} className="entree-droite mt-6">
            <Choix type="traduis" mot={actuelle} choix={choix} onRepondu={(juste) => setDire({ juste, score: null })} />
          </div>
        )}
        {actuelle && parle && (
          <div key={index} className="entree-droite mt-6">
            <DisLe
              mot={actuelle}
              inverse
              phrase={actuelle.latin.includes(' ')}
              titre="À toi"
              consigne={`Comment le dis-tu en darija ? L’indice t’aide si besoin.`}
              onPret={setDire}
              onRepondu={valider}
              onPasMaintenant={() => {
                void couperUnMoment('parler')
                setSansParler(true)
              }}
            />
          </div>
        )}
        <div ref={bas} />
      </div>

      {(phase === 'ecoute' || phase === 'fin' || dire) && (
        <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="verre mx-auto flex max-w-xl flex-col gap-2 rounded-panneau p-3">
            {phase === 'ecoute' && (
              <>
                <Bouton
                  grand
                  variante="teinte"
                  className="w-full"
                  onClick={() => (enLecture !== null ? arreter() : void lireSuite(0, repliques.length))}
                >
                  {enLecture !== null ? (
                    <>
                      <Square className="h-5 w-5" fill="currentColor" strokeWidth={2} aria-hidden /> Arrêter
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" fill="currentColor" strokeWidth={2} aria-hidden /> Tout écouter
                    </>
                  )}
                </Bouton>
                <Bouton grand className="w-full" onClick={commencer}>
                  À toi de jouer
                </Bouton>
              </>
            )}
            {phase === 'jeu' && dire && (
              <Bouton grand className={`w-full ${dire.juste ? '!bg-vert-plein' : ''}`} onClick={() => valider(dire)}>
                Continuer
              </Bouton>
            )}
            {phase === 'fin' && (
              <Bouton grand className="w-full" onClick={() => void terminer()}>
                Terminer
              </Bouton>
            )}
          </div>
        </div>
      )}

      {confirmer && (
        <Alerte
          titre="Quitter le dialogue ?"
          message="Cette partie ne sera pas comptée."
          onAnnuler={() => setConfirmer(false)}
          actions={[
            { libelle: 'Continuer', role: 'annuler', action: () => setConfirmer(false) },
            {
              libelle: 'Quitter',
              role: 'destructif',
              action: () => {
                arreter()
                onFermer()
              },
            },
          ]}
        />
      )}
    </div>
  )
}

function Bulle(props: {
  moi: boolean
  nom: string
  latin: string
  arabe: string | null
  fr: string
  active: boolean
  resultat?: boolean
  onToucher: () => void
}) {
  return (
    <li className={`flex ${props.moi ? 'justify-end' : 'justify-start'}`}>
      <button
        type="button"
        onClick={props.onToucher}
        aria-label={`${props.nom} : ${props.latin}, ${props.fr}. Réécouter.`}
        className={`pressable max-w-[85%] rounded-[22px] px-4 py-3 text-left transition-shadow ${
          props.moi ? 'rounded-br-md bg-accent-doux' : 'rounded-bl-md bg-carte'
        } ${props.active ? 'ring-2 ring-accent' : ''}`}
      >
        <span className="t-note flex items-center gap-1 font-semibold text-texte-2">
          {props.nom}
          {props.resultat === true && <CircleCheck className="h-4 w-4 text-vert" strokeWidth={2.5} aria-label="Réussie" />}
          {props.resultat === false && <CircleX className="h-4 w-4 text-rouge" strokeWidth={2.5} aria-label="À retravailler" />}
        </span>
        <span className="t-gras block">{props.latin}</span>
        {props.arabe && (
          <span className="arabe block text-left text-[1.15rem]" dir="rtl" lang="ar">
            {props.arabe}
          </span>
        )}
        <span className="t-sous-titre block text-texte-2">{props.fr}</span>
      </button>
    </li>
  )
}
