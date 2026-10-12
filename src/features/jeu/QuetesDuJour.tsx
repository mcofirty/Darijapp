import { CircleCheck, Circle } from 'lucide-react'
import { useState } from 'react'
import { ouvrirCoffre } from '../../db/journal'
import { useJeu } from '../../db/useJeu'
import { XP_COFFRE } from '../../gamification/quetes'
import { Bouton } from '../../ui/Boutons'
import { Ligne, Section } from '../../ui/Liste'

/** Verre à thé marocain : il se remplit de thé quand la quête est faite. */
function Verre({ plein }: { plein: boolean }) {
  return (
    <svg viewBox="0 0 24 32" className="h-8 w-6" aria-hidden>
      <path d="M3 3h18l-2.6 25.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-texte-3" />
      {plein && <path d="M5.1 11h13.8l-1.9 17.1a1.2 1.2 0 0 1-1.2 1.1H8.2A1.2 1.2 0 0 1 7 28.1z" fill="#2e8b57" />}
      {plein && <path d="M9 12.5c1.5-2.5 4.5-2.5 6 0" fill="none" stroke="#7fd39b" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  )
}

/** Les 3 quêtes du jour ; chacune remplit un verre de thé, les 3 verres pleins ouvrent la théière (+60 XP). */
export function QuetesDuJour() {
  const { quetes, coffreOuvert } = useJeu()
  const [gagne, setGagne] = useState(0)
  if (quetes.length === 0) return null
  const faites = quetes.filter((q) => q.faite).length
  const toutes = faites === quetes.length

  return (
    <Section
      titre="Quêtes du jour"
      note={toutes ? undefined : `Termine les ${quetes.length} quêtes pour ouvrir la théière : +${XP_COFFRE} XP. Nouvelles quêtes à minuit.`}
    >
      {quetes.map(({ quete, valeur, faite }) => (
        <Ligne
          key={quete.id}
          tuile={
            faite ? (
              <CircleCheck className="h-[29px] w-[29px] shrink-0 text-vert" strokeWidth={2.2} aria-label="Faite" />
            ) : (
              <Circle className="h-[29px] w-[29px] shrink-0 text-texte-3" strokeWidth={2} aria-label="À faire" />
            )
          }
          titre={<span className={faite ? 'text-texte-2' : ''}>{quete.titre}</span>}
          valeur={quete.objectif > 1 ? `${valeur}/${quete.objectif}` : undefined}
        />
      ))}
      <div className="flex items-center gap-3 px-marge py-3">
        <div className="flex gap-1" role="img" aria-label={`${faites} verre${faites > 1 ? 's' : ''} de thé sur ${quetes.length}`}>
          {quetes.map((q) => (
            <Verre key={q.quete.id} plein={q.faite} />
          ))}
        </div>
        <div className="min-w-0 flex-1 text-right">
          {coffreOuvert ? (
            <p className="t-appel font-semibold text-vert">{gagne > 0 ? `+${gagne} XP, bravo !` : 'Théière ouverte aujourd’hui'}</p>
          ) : toutes ? (
            <Bouton variante="plein" onClick={async () => setGagne(await ouvrirCoffre())}>
              Ouvrir la théière
            </Bouton>
          ) : (
            <p className="t-sous-titre text-texte-2">Théière : {faites}/{quetes.length}</p>
          )}
        </div>
      </div>
    </Section>
  )
}
