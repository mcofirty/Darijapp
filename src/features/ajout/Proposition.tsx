import { useState } from 'react'
import type { ChampsMot } from '../../data/motsPerso'
import { ajouterSiAbsent } from '../../db/motsPerso'
import { Bouton } from '../../ui/Boutons'
import { Page } from '../../ui/Page'

/** Écran affiché quand on ouvre un lien « #mot=… » : le mot n'est ajouté qu'après confirmation. */
export function Proposition({ mot, onTermine }: { mot: ChampsMot; onTermine: () => void }) {
  const [fait, setFait] = useState<'ajoute' | 'existait' | null>(null)

  async function ajouter() {
    const { nouveau } = await ajouterSiAbsent(mot)
    setFait(nouveau ? 'ajoute' : 'existait')
  }

  return (
    <Page titre="Nouveau mot">
      <div className="mb-8 rounded-liste bg-carte px-4 py-6 text-center">
        <p className="arabe text-[2.4rem] leading-tight" dir="rtl" lang="ar">
          {mot.arabe}
        </p>
        <p className="t-titre-2 mt-2">{mot.latin}</p>
        <p className="t-titre-3 mt-1 text-texte-2">{mot.fr}</p>
      </div>
      {fait ? (
        <>
          <p className="t-corps mb-6 text-center">
            {fait === 'ajoute' ? 'Le mot est ajouté. Il arrive en tête de tes prochaines sessions.' : 'Ce mot est déjà dans Mes mots.'}
          </p>
          <Bouton grand className="w-full" onClick={onTermine}>
            Ouvrir l’appli
          </Bouton>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <Bouton grand onClick={ajouter}>
            Ajouter ce mot
          </Bouton>
          <Bouton variante="gris" grand onClick={onTermine}>
            Ignorer
          </Bouton>
        </div>
      )}
    </Page>
  )
}
