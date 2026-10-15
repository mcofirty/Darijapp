import { Volume2 } from 'lucide-react'
import { useState } from 'react'
import { jouer, jouerAuto } from '../../audio/lecteur'
import type { Mot } from '../../data/types'
import { PhraseTouchable } from '../../ui/PhraseTouchable'

/** Phrase à trou, à l'écrit : l'exemple du mot sans le mot, à choisir parmi 4. */
export function Trou({ mot, morceaux, trou, choix, onRepondu }: { mot: Mot; morceaux: string[]; trou: number; choix: string[]; onRepondu: (juste: boolean) => void }) {
  const [choisi, setChoisi] = useState<string | null>(null)
  const bon = morceaux[trou]

  function choisir(c: string) {
    if (choisi) return
    setChoisi(c)
    onRepondu(c === bon)
    // La phrase entière est lue une fois la réponse donnée.
    window.setTimeout(() => jouerAuto(mot.exemple.audio, mot.exemple.arabe), 900)
  }

  return (
    <div>
      <h2 className="t-titre-2">Phrase à trou</h2>
      <p className="t-appel mb-5 mt-1 text-texte-2">Choisis le mot qui manque.</p>
      <div className="mb-6 rounded-liste bg-carte px-marge py-5 text-center">
        <p className="t-titre-2 leading-snug">
          <PhraseTouchable
            latin={morceaux.join(' ')}
            trou={trou}
            remplacement={
              choisi ? (
                <span className={`rounded-lg px-1.5 ${choisi === bon ? 'bg-vert-doux text-vert' : 'bg-rouge-doux text-rouge'}`}>{bon}</span>
              ) : undefined
            }
          />
        </p>
        <p className="t-sous-titre mt-2 text-texte-2">{mot.exemple.fr}</p>
        {choisi && (
          <button type="button" onClick={() => jouer(mot.exemple.audio, mot.exemple.arabe)} className="pressable t-appel mt-3 inline-flex items-center gap-1.5 text-accent">
            <Volume2 className="h-5 w-5" strokeWidth={2.2} aria-hidden /> Écouter la phrase
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choix.map((c) => {
          const etat = !choisi ? 'neutre' : c === bon ? 'juste' : c === choisi ? 'faux' : 'eteint'
          return (
            <button
              key={c}
              type="button"
              disabled={choisi !== null}
              onClick={() => choisir(c)}
              className={`pressable t-gras min-h-14 rounded-reponse px-4 py-3 transition-colors ${
                etat === 'juste' ? 'bg-vert-doux text-vert' : etat === 'faux' ? 'bg-rouge-doux text-rouge' : etat === 'eteint' ? 'bg-carte opacity-50' : 'bg-carte'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}
