import { BookOpen, CircleCheck, CircleX, Languages, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { arreterLecture, jouer, jouerAuto } from '../../audio/lecteur'
import { sonReponse } from '../../audio/effets'
import { enregistrerActivite, type BilanSession } from '../../db/apprentissage'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { meilleurResultat } from '../../exercices/dialogues'
import { HISTOIRES, NARRATEUR, deroule, reponsesMelangees, type Histoire, type LigneHistoire } from '../../exercices/histoires'
import { Alerte } from '../../ui/Alerte'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section } from '../../ui/Liste'
import { Mascotte, PhraseDeMascotte } from '../../ui/Mascotte'
import { Page } from '../../ui/Page'
import { PhraseTouchable } from '../../ui/PhraseTouchable'
import { RemplissageBarre } from '../../ui/zellige'
import { Bilan } from '../session/Bilan'

/** Liste des histoires, puis une histoire en plein écran. */
export function Histoires({ onRetour }: { onRetour: () => void }) {
  const [enCours, setEnCours] = useState<{ histoire: Histoire; numero: number } | null>(null)
  const { histoires } = useProfil()

  if (enCours)
    return (
      <LectureHistoire
        key={enCours.numero}
        histoire={enCours.histoire}
        onFermer={() => setEnCours(null)}
        onEncore={() => setEnCours((e) => e && { histoire: e.histoire, numero: e.numero + 1 })}
      />
    )

  return (
    <Page titre="Histoires" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <Section note="De courts récits en darija, lus par Jamal. Touche un mot souligné pour sa traduction ; des questions vérifient que tu as compris.">
        {HISTOIRES.map((h) => {
          const meilleur = histoires[h.id]
          return (
            <Ligne
              key={h.id}
              tuile={
                <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-tuile text-[17px]" style={{ backgroundColor: h.couleur }} aria-hidden>
                  {h.illustration}
                </span>
              }
              titre={h.titre}
              sousTitre={h.resume}
              valeur={meilleur !== undefined ? `${meilleur}/${h.questions.length}` : undefined}
              chevron
              onClick={() => setEnCours((e) => ({ histoire: h, numero: (e?.numero ?? 0) + 1 }))}
            />
          )
        })}
      </Section>
    </Page>
  )
}

/** Une histoire : les lignes arrivent une à une (lues par la voix), coupées de questions de compréhension. */
function LectureHistoire({ histoire, onFermer, onEncore }: { histoire: Histoire; onFermer: () => void; onEncore: () => void }) {
  const profil = useProfil()
  const morceaux = useMemo(() => deroule(histoire), [histoire])
  // Réponses mélangées une fois pour toutes, par morceau.
  const reponses = useMemo(() => morceaux.map((m) => (m.type === 'question' ? reponsesMelangees(m.question) : null)), [morceaux])
  // Nombre de morceaux affichés ; le dernier est celui en cours.
  const [vus, setVus] = useState(1)
  const [choisis, setChoisis] = useState<Record<number, number>>({})
  const [traduites, setTraduites] = useState<Set<number>>(new Set())
  const [bilan, setBilan] = useState<BilanSession | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  const bas = useRef<HTMLDivElement>(null)

  const actuel = morceaux[vus - 1]
  const reponduActuel = actuel.type === 'question' ? choisis[vus - 1] !== undefined : true
  const fin = vus === morceaux.length && reponduActuel
  const bonnes = Object.entries(choisis).filter(([i, c]) => reponses[Number(i)]?.bonne === c).length
  const mauvaises = Object.keys(choisis).length - bonnes

  // Chaque nouvelle ligne est lue (sauf sans écouter), puis on fait défiler vers le bas.
  useEffect(() => {
    if (actuel.type === 'ligne') {
      const l = histoire.lignes[actuel.index]
      jouerAuto(l.audio, l.arabe)
    }
    window.setTimeout(() => bas.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
  }, [vus])

  useEffect(() => () => arreterLecture(), [])

  function repondre(i: number, choix: number) {
    if (choisis[i] !== undefined) return
    setChoisis({ ...choisis, [i]: choix })
    sonReponse(reponses[i]?.bonne === choix)
    window.setTimeout(() => bas.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
  }

  async function terminer() {
    arreterLecture()
    await modifierProfil({ histoires: meilleurResultat(profil.histoires, histoire.id, bonnes) })
    setBilan(await enregistrerActivite('histoire', { bonnes, mauvaises }))
  }

  if (bilan)
    return (
      <Bilan
        titre={mauvaises === 0 ? 'Tout compris !' : 'Histoire terminée'}
        sousTitre={`${bonnes} bonne${bonnes > 1 ? 's' : ''} réponse${bonnes > 1 ? 's' : ''} sur ${bonnes + mauvaises}`}
        xp={bilan.xp}
        activite={bilan}
        taux={bonnes / Math.max(1, bonnes + mauvaises)}
        libelleEncore="Relire l’histoire"
        onFermer={onFermer}
        onEncore={onEncore}
      />
    )

  return (
    <div data-sans-balayage className="fixed inset-0 z-30 flex flex-col bg-fond">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-marge pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={() => (vus === 1 ? (arreterLecture(), onFermer()) : setConfirmer(true))}
          aria-label="Quitter l’histoire"
          className="verre verre-fin pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <div className="verre verre-fin flex h-11 flex-1 items-center rounded-full px-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <RemplissageBarre fraction={vus / morceaux.length} />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-marge pb-6 pt-2">
        {/* Couverture illustrée */}
        <div className="relative mb-5 overflow-hidden rounded-carte px-marge py-6 text-center" style={{ backgroundColor: `color-mix(in srgb, ${histoire.couleur} 22%, var(--carte))` }}>
          <p className="relative mt-2 text-[56px] leading-none" aria-hidden>
            {histoire.illustration}
          </p>
          <p className="t-titre-2 relative mt-3">{histoire.titre}</p>
          <p className="t-sous-titre relative mt-1 text-texte-2">{histoire.resume}</p>
        </div>

        <ul className="space-y-3">
          {morceaux.slice(0, vus).map((m, i) =>
            m.type === 'ligne' ? (
              <LigneLue
                key={i}
                ligne={histoire.lignes[m.index]}
                arabe={profil.afficherArabe}
                traduite={traduites.has(i)}
                onTraduire={() => setTraduites(new Set(traduites).add(i))}
              />
            ) : (
              <li key={i} className="entree-droite rounded-liste bg-carte p-marge">
                <p className="t-note mb-1 flex items-center gap-1 font-semibold uppercase text-accent">
                  <BookOpen className="h-4 w-4" strokeWidth={2.4} aria-hidden /> Question
                </p>
                <p className="t-titre-3 mb-3">{m.question.question}</p>
                <ul className="space-y-2">
                  {reponses[i]!.choix.map((c, j) => {
                    const choisi = choisis[i]
                    const etat = choisi === undefined ? 'neutre' : j === reponses[i]!.bonne ? 'juste' : j === choisi ? 'faux' : 'eteint'
                    return (
                      <li key={c}>
                        <button
                          type="button"
                          disabled={choisi !== undefined}
                          onClick={() => repondre(i, j)}
                          className={`pressable flex min-h-12 w-full items-center gap-3 rounded-reponse px-4 py-2.5 text-left transition-colors ${
                            etat === 'juste' ? 'bg-vert-doux text-vert' : etat === 'faux' ? 'bg-rouge-doux text-rouge' : etat === 'eteint' ? 'bg-fond opacity-50' : 'bg-fond'
                          }`}
                        >
                          <span className="t-gras flex-1">{c}</span>
                          {etat === 'juste' && <CircleCheck className="h-6 w-6 shrink-0" strokeWidth={2.4} aria-label="Bonne réponse" />}
                          {etat === 'faux' && <CircleX className="h-6 w-6 shrink-0" strokeWidth={2.4} aria-label="Mauvaise réponse" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {choisis[i] !== undefined && (
                  <div className="mt-3 flex items-center gap-3" aria-live="polite">
                    <Mascotte humeur={choisis[i] === reponses[i]!.bonne ? 'bravo' : 'rate'} className="h-11 w-11" />
                    <PhraseDeMascotte humeur={choisis[i] === reponses[i]!.bonne ? 'bravo' : 'rate'} cle={i} />
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
        <div ref={bas} />
      </div>

      {reponduActuel && (
        <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="verre mx-auto flex max-w-xl flex-col gap-2 rounded-panneau p-3">
            {fin ? (
              <Bouton grand className="w-full" onClick={() => void terminer()}>
                Terminer
              </Bouton>
            ) : (
              <Bouton grand className="w-full" onClick={() => setVus(vus + 1)}>
                Continuer
              </Bouton>
            )}
          </div>
        </div>
      )}

      {confirmer && (
        <Alerte
          titre="Quitter l’histoire ?"
          message="Cette lecture ne sera pas comptée."
          onAnnuler={() => setConfirmer(false)}
          actions={[
            { libelle: 'Continuer', role: 'annuler', action: () => setConfirmer(false) },
            {
              libelle: 'Quitter',
              role: 'destructif',
              action: () => {
                arreterLecture()
                onFermer()
              },
            },
          ]}
        />
      )}
    </div>
  )
}

/** Une ligne de l'histoire : narration ou réplique, illustrée ; la toucher la relit, la traduction est à la demande. */
function LigneLue({ ligne, arabe, traduite, onTraduire }: { ligne: LigneHistoire; arabe: boolean; traduite: boolean; onTraduire: () => void }) {
  const narration = ligne.qui === NARRATEUR
  return (
    <li className={`entree-droite flex items-start gap-3 ${narration ? '' : 'pl-4'}`}>
      <button
        type="button"
        onClick={() => jouer(ligne.audio, ligne.arabe)}
        aria-label={`Réécouter : ${ligne.latin}`}
        className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-carte text-[26px]"
      >
        <span aria-hidden>{ligne.image}</span>
      </button>
      <div className={`min-w-0 flex-1 px-4 py-3 ${narration ? 'rounded-liste bg-carte' : 'rounded-[22px] rounded-tl-md bg-accent-doux'}`}>
        {!narration && <p className="t-note font-semibold text-texte-2">{ligne.qui}</p>}
        <PhraseTouchable latin={ligne.latin} className="t-gras block" />
        {arabe && (
          <span className="arabe block text-left text-[1.15rem]" dir="rtl" lang="ar">
            {ligne.arabe}
          </span>
        )}
        {traduite ? (
          <p className="t-sous-titre text-texte-2">{ligne.fr}</p>
        ) : (
          <button type="button" onClick={onTraduire} className="t-sous-titre mt-1 flex items-center gap-1 text-accent">
            <Languages className="h-4 w-4" strokeWidth={2.2} aria-hidden /> Traduire
          </button>
        )}
      </div>
    </li>
  )
}
