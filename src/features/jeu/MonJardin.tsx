import { Coins } from 'lucide-react'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { STADES, croissance } from '../../gamification/jardin'
import { NOMS_NIVEAUX } from '../../gamification/xp'
import { Bouton } from '../../ui/Boutons'
import { Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { Jardin, Plante } from './Plante'

/**
 * « Mon jardin » : la plante en grand, qui grandit avec chaque XP (sessions, leçons, quiz, jeux),
 * dans le décor et avec les objets achetés au souk. Ouvert en touchant la barre de niveau.
 */
export function MonJardin({ retour, onSouk }: { retour: { libelle: string; action: () => void }; onSouk: () => void }) {
  const { xpTotal } = useResume()
  const { espece, pot, fond, objets } = useProfil()
  const c = croissance(xpTotal)
  return (
    <Page titre="Mon jardin" retour={retour}>
      <div className="mb-[26px] overflow-hidden rounded-carte bg-carte">
        <Jardin stade={c.stade} avancement={c.avancement} espece={espece} pot={pot} fond={fond} objets={objets} />
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

      <Bouton grand variante="teinte" className="mb-[26px] w-full" onClick={onSouk}>
        <Coins className="h-5 w-5" strokeWidth={2.4} aria-hidden /> Décorer au souk
      </Bouton>
    </Page>
  )
}
