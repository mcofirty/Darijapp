import { Gauge } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MOTS } from '../../data'
import { db, modifierProfil } from '../../db/db'
import { BLOCS_MAX, QUESTIONS_PAR_BLOC, blocSu, blocsDuProgramme, progressionsSautees, questionsDuBloc } from '../../exercices/epreuves'
import { ajouterJours, dateLocale } from '../../srs/dates'
import { Bouton } from '../../ui/Boutons'
import { Page } from '../../ui/Page'
import { Choix } from '../session/Choix'

/**
 * Test de niveau : le programme est parcouru par blocs de 60 mots, 3 questions par bloc ; le test s'arrête au
 * premier bloc raté (moins de 2 bonnes réponses). Les mots des blocs sus passent en révision au lieu d'être
 * présentés comme nouveaux.
 */
export function TestNiveau({ onRetour }: { onRetour: () => void }) {
  const blocs = useMemo(() => blocsDuProgramme(MOTS), [])
  const [etat, setEtat] = useState<'intro' | 'questions' | 'fin'>('intro')
  const [bloc, setBloc] = useState(0)
  const [questions, setQuestions] = useState(() => questionsDuBloc(blocs[0]))
  const [index, setIndex] = useState(0)
  const [justes, setJustes] = useState(0)
  const [sus, setSus] = useState(0)
  const [enregistre, setEnregistre] = useState(false)

  function repondre(juste: boolean) {
    const j = justes + (juste ? 1 : 0)
    window.setTimeout(() => {
      if (index + 1 < QUESTIONS_PAR_BLOC) {
        setJustes(j)
        setIndex(index + 1)
        return
      }
      // Fin du bloc : on passe au suivant s'il est su, sinon le test s'arrête.
      if (blocSu(j) && bloc + 1 < blocs.length) {
        setSus(bloc + 1)
        setBloc(bloc + 1)
        setQuestions(questionsDuBloc(blocs[bloc + 1]))
        setIndex(0)
        setJustes(0)
      } else {
        setSus(blocSu(j) ? bloc + 1 : bloc)
        setEtat('fin')
      }
    }, 900)
  }

  async function valider() {
    const connus = new Set(await db.progression.toCollection().primaryKeys())
    const mots = blocs.slice(0, sus).flat().filter((m) => !connus.has(m.id))
    await db.progression.bulkPut(progressionsSautees(mots, dateLocale(), ajouterJours))
    await modifierProfil({ testNiveau: 'fait' })
    setEnregistre(true)
  }

  const nbSus = blocs.slice(0, sus).flat().length
  return (
    <Page titre="Test de niveau" retour={{ libelle: 'Retour', action: onRetour }}>
      {etat === 'intro' && (
        <section className="mb-[26px] rounded-carte bg-carte p-marge text-center">
          <Gauge className="mx-auto h-12 w-12 text-accent" strokeWidth={1.8} aria-hidden />
          <p className="t-corps mt-3">
            Tu connais déjà un peu de darija ? Le test monte en difficulté : 3 questions par étape du programme, jusqu’à {BLOCS_MAX} étapes. Il s’arrête dès
            que tu bloques.
          </p>
          <p className="t-sous-titre mt-2 text-texte-2">Les mots que tu connais passent en révision : tu ne les verras plus comme nouveaux.</p>
          <Bouton grand className="mt-5 w-full" onClick={() => setEtat('questions')}>
            Commencer le test
          </Bouton>
        </section>
      )}
      {etat === 'questions' && (
        <>
          <p className="t-note mb-3 font-semibold uppercase text-accent">
            Niveau {bloc + 1} sur {blocs.length} · question {index + 1} sur {QUESTIONS_PAR_BLOC}
          </p>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <div className="h-full rounded-full bg-accent-plein transition-[width]" style={{ width: `${((bloc * QUESTIONS_PAR_BLOC + index) / (blocs.length * QUESTIONS_PAR_BLOC)) * 100}%` }} />
          </div>
          <Choix key={`${bloc}-${index}`} type="traduis" mot={questions[index].type === 'traduis' ? questions[index].mot : MOTS[0]} choix={questions[index].type === 'traduis' ? questions[index].choix : []} onRepondu={repondre} />
        </>
      )}
      {etat === 'fin' && (
        <section className="mb-[26px] rounded-carte bg-carte p-marge text-center">
          <p className="t-titre-2">{sus === 0 ? 'On commence par le début !' : `Tu connais déjà environ ${nbSus} mots`}</p>
          <p className="t-corps mt-2 text-texte-2">
            {sus === 0
              ? 'Les sessions du jour te présenteront les mots dans l’ordre du programme.'
              : enregistre
                ? 'C’est fait : ces mots passent en révision, étalés sur deux semaines. Les sessions reprennent plus loin dans le programme.'
                : `Les ${nbSus} premiers mots du programme passent en révision au lieu d’être présentés comme nouveaux.`}
          </p>
          {sus > 0 && !enregistre ? (
            <div className="mt-5 flex flex-col gap-2">
              <Bouton grand className="w-full" onClick={() => void valider()}>
                Sauter ces mots
              </Bouton>
              <Bouton grand variante="gris" className="w-full" onClick={() => void modifierProfil({ testNiveau: 'fait' }).then(onRetour)}>
                Tout reprendre du début
              </Bouton>
            </div>
          ) : (
            <Bouton grand className="mt-5 w-full" onClick={() => void modifierProfil({ testNiveau: 'fait' }).then(onRetour)}>
              Terminé
            </Bouton>
          )}
        </section>
      )}
    </Page>
  )
}
