import { Check } from 'lucide-react'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { Avatar, FONDS, VISAGES } from '../../ui/Avatar'
import { Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'

/** Personnalise l'avatar : prénom, visage et couleur, enregistrés au fur et à mesure. */
export function MonAvatar({ onRetour }: { onRetour: () => void }) {
  const profil = useProfil()
  return (
    <Page titre="Mon avatar" retour={{ libelle: 'Profil', action: onRetour }}>
      <div className="mb-[26px] flex flex-col items-center gap-3">
        <Avatar visage={profil.avatar} fond={profil.avatarFond} taille={112} />
        <p className="t-titre-2">{profil.prenom.trim() ? `Salam, ${profil.prenom.trim()} !` : 'Salam !'}</p>
      </div>
      <Section titre="Prénom" note="Pour te saluer dans l’appli. Il reste sur ton iPhone.">
        <label className="block px-marge py-2">
          <span className="sr-only">Prénom</span>
          <input
            data-sans-balayage
            value={profil.prenom}
            placeholder="Ton prénom"
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) => void modifierProfil({ prenom: e.target.value })}
            className="t-corps block min-h-11 w-full bg-transparent outline-none placeholder:text-texte-3"
          />
        </label>
      </Section>
      <Section titre="Visage">
        <div className="grid grid-cols-4 gap-3 p-marge">
          {VISAGES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => void modifierProfil({ avatar: v })}
              aria-label={`Visage ${v}`}
              aria-pressed={profil.avatar === v}
              className={`pressable flex aspect-square items-center justify-center rounded-full text-[32px] ${
                profil.avatar === v ? 'bg-accent-doux ring-2 ring-accent' : 'bg-remplissage'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Section>
      <Section titre="Couleur">
        <div className="grid grid-cols-4 gap-3 p-marge">
          {FONDS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => void modifierProfil({ avatarFond: f })}
              aria-label={`Couleur ${f}`}
              aria-pressed={profil.avatarFond === f}
              className="pressable flex aspect-square items-center justify-center rounded-full text-white"
              style={{ background: f }}
            >
              {profil.avatarFond === f && <Check className="h-7 w-7" strokeWidth={3} aria-hidden />}
            </button>
          ))}
        </div>
      </Section>
    </Page>
  )
}
