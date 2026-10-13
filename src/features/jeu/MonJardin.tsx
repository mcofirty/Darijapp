import { useLiveQuery } from 'dexie-react-hooks'
import { Coins, Sprout } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { lireXpTotal } from '../../db/apprentissage'
import { lireProfil, modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { STADES, croissance, etapesDeCroissance } from '../../gamification/jardin'
import { NOMS_NIVEAUX } from '../../gamification/xp'
import { Bouton } from '../../ui/Boutons'
import { Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { Jardin, Plante } from './Plante'
import { useCroissanceAnimee } from './useCroissanceAnimee'

/**
 * « Mon jardin » : la plante en grand, qui grandit avec chaque XP (sessions, leçons, quiz, jeux),
 * dans le décor et avec les objets achetés au souk. Ouvert en touchant la barre de niveau.
 */
export function MonJardin({ retour, onSouk }: { retour: { libelle: string; action: () => void }; onSouk: () => void }) {
  return (
    <Page titre="Mon jardin" retour={retour}>
      <ContenuJardin onSouk={onSouk} />
    </Page>
  )
}

/** Le contenu de « Mon jardin », seul (troisième choix du menu de Progrès) ou dans sa page (depuis Apprendre). */
export function ContenuJardin({ onSouk }: { onSouk: () => void }) {
  const { xpTotal } = useResume()
  const { espece, pot, fond, objets } = useProfil()
  const c = croissance(xpTotal)

  // Point de départ de l'animation : l'XP de la dernière visite (la graine à la toute première).
  const xpLu = useLiveQuery(() => lireXpTotal(), [])
  const profilLu = useLiveQuery(() => lireProfil(), [])
  const [anim, setAnim] = useState<{ depart: number; arrivee: number; cle: number } | null>(null)
  useEffect(() => {
    if (xpLu === undefined || profilLu === undefined || anim) return
    setAnim({ depart: Math.min(profilLu.jardinXpVu ?? 0, xpLu), arrivee: xpLu, cle: 1 })
    void modifierProfil({ jardinXpVu: xpLu })
  }, [xpLu, profilLu, anim])
  const etapes = useMemo(() => (anim ? etapesDeCroissance(anim.depart, anim.arrivee) : []), [anim])
  const fin = anim ? croissance(anim.arrivee) : c
  const plante = useCroissanceAnimee(etapes, fin, anim?.cle ?? 0)
  const avant = anim ? croissance(anim.depart) : c
  const aGrandi = anim !== null && fin.stade > avant.stade

  return (
    <>
      <div className="mb-[26px] overflow-hidden rounded-carte bg-carte">
        {/* Un toucher pendant l'animation la passe. */}
        <div onClick={plante.enCours ? plante.passer : undefined} className={plante.enCours ? 'cursor-pointer' : undefined}>
          <Jardin stade={plante.stade} avancement={plante.avancement} espece={espece} pot={pot} fond={fond} objets={objets} pop={plante.pop} />
        </div>
        {aGrandi && (
          <p className="t-appel flex items-center gap-2 bg-vert-doux px-marge py-3 font-semibold text-vert" role="status">
            <Sprout className="h-5 w-5 shrink-0" strokeWidth={2.4} aria-hidden />
            {anim.depart === 0 ? `Ta plante a poussé jusqu’au stade « ${fin.nom} » !` : `Ta plante a grandi : « ${avant.nom} » → « ${fin.nom} » !`}
          </p>
        )}
        <div className="p-marge">
          <p className="t-note font-semibold uppercase text-accent">
            Stade {c.stade} sur {STADES}
          </p>
          <h2 className="t-titre-2 mt-1">{c.nom}</h2>
          <span className="mt-3 block h-2 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <span className="block h-full rounded-full bg-vert-plein transition-[width] duration-700" style={{ width: `${c.avancement * 100}%` }} />
          </span>
          <p className="t-sous-titre mt-2 text-texte-2">
            {c.prochain
              ? `Encore ${c.xpRestants} XP avant « ${c.prochain} ». Chaque bonne réponse la fait pousser.`
              : c.xpRestants > 0
                ? `Encore ${c.xpRestants} XP pour que ton arbre atteigne sa pleine taille.`
                : 'Ton arbre a sa pleine taille. Bravo !'}
          </p>
        </div>
      </div>

      <Section titre="Les étapes de ta plante">
        <div className="grid grid-cols-5 gap-y-3 px-2 py-4">
          {NOMS_NIVEAUX.map((nom, i) => {
            const stade = i + 1
            const atteint = stade <= c.stade
            return (
              <div key={nom} className={`flex flex-col items-center ${atteint ? '' : 'opacity-35 grayscale'}`} aria-label={`${nom}${atteint ? ', atteint' : ''}`}>
                <span className={`rounded-full p-0.5 ${stade === c.stade ? 'ring-2 ring-[var(--accent)]' : ''}`}>
                  <Plante stade={stade} avancement={0.6} espece={espece} pot={pot} taille={40} />
                </span>
                <span className={`t-legende mt-1 ${stade === c.stade ? 'font-semibold text-accent' : 'text-texte-2'}`}>{nom}</span>
              </div>
            )
          })}
        </div>
      </Section>

      <div className="mb-[26px] flex flex-col gap-2">
        <Bouton grand variante="teinte" className="w-full" onClick={onSouk}>
          <Coins className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Décorer au souk
        </Bouton>
        {xpLu !== undefined && xpLu > 0 && (
          <Bouton
            grand
            variante="gris"
            className="w-full"
            disabled={plante.enCours}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              setAnim({ depart: 0, arrivee: xpLu, cle: (anim?.cle ?? 0) + 1 })
            }}
          >
            <Sprout className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Revoir sa pousse depuis la graine
          </Bouton>
        )}
      </div>
    </>
  )
}

