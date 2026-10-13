import { CircleCheck, CircleX, ShoppingBag, Volume2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { jouer } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { enregistrerActivite, type BilanSession } from '../../db/apprentissage'
import { useMots } from '../../db/motsPerso'
import { useProfil } from '../../db/useProfil'
import { ARTICLES_SOUK, negociation, remise, type ArticleSouk, type EtapeMarchandage } from '../../exercices/jeux'
import { melanger } from '../../exercices/session'
import { Alerte } from '../../ui/Alerte'
import { Bouton } from '../../ui/Boutons'
import { Bilan } from '../session/Bilan'

/** Articles marchandés par partie. */
const ARTICLES_PAR_PARTIE = 2

interface Props {
  onFermer: () => void
  onEncore: () => void
}

/** Marchandage au souk : comprendre les prix annoncés en darija et répondre pour faire baisser le prix. */
export function Marchandage({ onFermer, onEncore }: Props) {
  const MOTS = useMots()
  const { afficherArabe } = useProfil()
  const partie = useMemo(
    () =>
      melanger(ARTICLES_SOUK)
        .slice(0, ARTICLES_PAR_PARTIE)
        .flatMap((article) => negociation(article, MOTS).map((etape) => ({ article, etape }))),
    // Une partie est tirée une fois, à l'ouverture.
    [],
  )
  const [index, setIndex] = useState(0)
  const [reponse, setReponse] = useState<{ juste: boolean; choix: string } | null>(null)
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  const score = useRef({ bonnes: 0, mauvaises: 0 })
  const { article, etape } = partie[index]

  // Le marchand parle dès que son étape s'affiche.
  useEffect(() => {
    if (etape.type === 'prix') jouer(etape.phrase.audio, etape.phrase.arabe)
  }, [etape])

  function repondre(juste: boolean, choix: string) {
    if (reponse) return
    sonReponse(juste)
    score.current[juste ? 'bonnes' : 'mauvaises']++
    setReponse({ juste, choix })
  }

  async function suivant() {
    setReponse(null)
    if (index + 1 < partie.length) setIndex(index + 1)
    else setBilan(await enregistrerActivite('marchandage', score.current))
  }

  if (bilan) {
    const { bonnes, mauvaises } = score.current
    return (
      <Bilan
        titre="Bonnes affaires !"
        sousTitre={`${bonnes} bonne${bonnes > 1 ? 's' : ''} réponse${bonnes > 1 ? 's' : ''} sur ${bonnes + mauvaises}`}
        xp={bilan.xp}
        activite={bilan}
        taux={bonnes / Math.max(1, bonnes + mauvaises)}
        libelleEncore="Marchander encore"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    )
  }

  const derniereDeLArticle = index + 1 === partie.length || partie[index + 1].article !== article

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={() => setConfirmer(true)}
          aria-label="Quitter le marchandage"
          className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <div className="verre verre-fin flex h-11 flex-1 items-center rounded-full px-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(index / partie.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-2">
        <ArticleEnVente article={article} afficherArabe={afficherArabe} />
        <div key={index} className="entree-droite">
          {etape.type === 'prix' ? (
            <QuestionPrix etape={etape} reponse={reponse} afficherArabe={afficherArabe} onRepondre={repondre} />
          ) : (
            <QuestionReplique etape={etape} reponse={reponse} afficherArabe={afficherArabe} onRepondre={repondre} />
          )}
        </div>
      </div>

      {reponse && (
        <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="verre mx-auto max-w-xl rounded-panneau p-3" aria-live="polite">
            <p className={`t-titre-3 flex items-center gap-2 px-2 pb-3 pt-1 ${reponse.juste ? 'text-vert' : 'text-rouge'}`}>
              {reponse.juste ? <CircleCheck className="h-6 w-6" strokeWidth={2.5} aria-hidden /> : <CircleX className="h-6 w-6" strokeWidth={2.5} aria-hidden />}
              {reponse.juste ? 'Bravo !' : 'Pas tout à fait'}
            </p>
            {derniereDeLArticle && (
              <p className="t-corps px-2 pb-3">
                Tu repars avec {article.nom} à {article.prix[2].montant} DH au lieu de {article.prix[0].montant} DH : −{remise(article)} %.
              </p>
            )}
            <Bouton grand className={`w-full ${reponse.juste ? '!bg-vert-plein' : ''}`} onClick={() => void suivant()}>
              Continuer
            </Bouton>
          </div>
        </div>
      )}

      {confirmer && (
        <Alerte
          titre="Quitter le souk ?"
          message="Cette partie ne sera pas comptée."
          onAnnuler={() => setConfirmer(false)}
          actions={[
            { libelle: 'Continuer', role: 'annuler', action: () => setConfirmer(false) },
            { libelle: 'Quitter', role: 'destructif', action: onFermer },
          ]}
        />
      )}
    </div>
  )
}

function ArticleEnVente({ article, afficherArabe }: { article: ArticleSouk; afficherArabe: boolean }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-liste bg-carte p-marge">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-doux text-accent" aria-hidden>
        <ShoppingBag className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="t-note block font-semibold uppercase text-accent">Au souk</span>
        <span className="t-gras block">
          {article.latin}
          {afficherArabe && (
            <span className="arabe ml-2 font-normal text-texte-2" lang="ar">
              {article.arabe}
            </span>
          )}
        </span>
        <span className="t-sous-titre block text-texte-2">Tu veux acheter {article.nom}.</span>
      </span>
    </div>
  )
}

const styleChoix = (etat: 'neutre' | 'juste' | 'faux' | 'eteint') =>
  etat === 'juste' ? 'bg-vert-doux text-vert' : etat === 'faux' ? 'bg-rouge-doux text-rouge' : etat === 'eteint' ? 'bg-carte opacity-50' : 'bg-carte'

function QuestionPrix({
  etape,
  reponse,
  afficherArabe,
  onRepondre,
}: {
  etape: Extract<EtapeMarchandage, { type: 'prix' }>
  reponse: { juste: boolean; choix: string } | null
  afficherArabe: boolean
  onRepondre: (juste: boolean, choix: string) => void
}) {
  const p = etape.phrase
  return (
    <div>
      <h2 className="t-titre-2">Le marchand annonce son prix</h2>
      <p className="t-appel mb-5 mt-1 text-texte-2">Combien demande-t-il ?</p>
      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={() => jouer(p.audio, p.arabe)}
          className="pressable flex h-20 w-20 items-center justify-center rounded-full bg-accent-plein text-white"
          aria-label="Réécouter le marchand"
        >
          <Volume2 className="h-9 w-9" strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      {/* La phrase n'apparaît qu'après la réponse : il faut d'abord la comprendre à l'oreille. */}
      {reponse && (
        <p className="t-corps mb-5 rounded-liste bg-carte px-marge py-3 text-center">
          <span className="font-semibold">{p.latin}</span>
          {afficherArabe && (
            <span className="arabe block text-[1.2rem]" dir="rtl" lang="ar">
              {p.arabe}
            </span>
          )}
          <span className="t-sous-titre block text-texte-2">{p.fr}</span>
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3">
        {etape.options.map((m) => {
          const etat = !reponse ? 'neutre' : m === p.montant ? 'juste' : String(m) === reponse.choix ? 'faux' : 'eteint'
          return (
            <li key={m}>
              <button
                type="button"
                disabled={reponse !== null}
                onClick={() => onRepondre(m === p.montant, String(m))}
                className={`pressable t-titre-3 min-h-14 w-full rounded-reponse px-4 transition-colors ${styleChoix(etat)}`}
              >
                {m} DH
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function QuestionReplique({
  etape,
  reponse,
  afficherArabe,
  onRepondre,
}: {
  etape: Extract<EtapeMarchandage, { type: 'replique' }>
  reponse: { juste: boolean; choix: string } | null
  afficherArabe: boolean
  onRepondre: (juste: boolean, choix: string) => void
}) {
  return (
    <div>
      <h2 className="t-titre-2">À toi de parler</h2>
      <p className="t-appel mb-5 mt-1 text-texte-2">{etape.consigne}</p>
      <ul className="space-y-3">
        {etape.choix.map((m) => {
          const etat = !reponse ? 'neutre' : m.id === etape.bonne.id ? 'juste' : m.id === reponse.choix ? 'faux' : 'eteint'
          return (
            <li key={m.id}>
              <button
                type="button"
                disabled={reponse !== null}
                onClick={() => {
                  jouer(m.audio, m.arabe)
                  onRepondre(m.id === etape.bonne.id, m.id)
                }}
                className={`pressable flex min-h-14 w-full flex-col items-start rounded-reponse px-5 py-3 text-left transition-colors ${styleChoix(etat)}`}
              >
                <span className="t-gras flex w-full items-baseline justify-between gap-3">
                  <span>{m.latin}</span>
                  {afficherArabe && (
                    <span className="arabe text-[1.15rem] font-normal opacity-70" dir="rtl" lang="ar">
                      {m.arabe}
                    </span>
                  )}
                </span>
                {reponse && <span className="t-sous-titre opacity-80">{m.fr}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
