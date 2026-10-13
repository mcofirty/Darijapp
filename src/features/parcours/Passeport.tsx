import { ETAPES, type EtatEtape } from '../../gamification/voyage'
import { Page } from '../../ui/Page'
import { fondZellige, useZellige } from '../../ui/zellige'

/** Couleur du tampon de chaque ville. */
const ENCRES = ['#c1272d', '#2e6fd8', '#3b82c4', '#8a5a2b', '#6b4fbb', '#006233', '#b8860b', '#d4572a', '#1f8a8a', '#b5651d']

/** Tampon rond, à l'encre de la ville, légèrement penché comme un vrai tampon. */
function Tampon({ ville, encre, obtenu, angle }: { ville: string; encre: string; obtenu: boolean; angle: number }) {
  const couleur = obtenu ? encre : 'var(--texte-3)'
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" style={{ transform: `rotate(${obtenu ? angle : 0}deg)`, opacity: obtenu ? 0.9 : 0.35 }} aria-hidden>
      <circle cx="60" cy="60" r="54" fill="none" stroke={couleur} strokeWidth="4" strokeDasharray={obtenu ? undefined : '6 6'} />
      <circle cx="60" cy="60" r="44" fill="none" stroke={couleur} strokeWidth="2" />
      <text x="60" y="56" textAnchor="middle" fontSize="15" fontWeight="700" fill={couleur} style={{ letterSpacing: 1 }}>
        {ville.toUpperCase()}
      </text>
      <text x="60" y="76" textAnchor="middle" fontSize="11" fill={couleur}>
        {obtenu ? '★ MAROC ★' : '?'}
      </text>
    </svg>
  )
}

/** Passeport : un tampon par étape du voyage, à l'encre de la ville une fois obtenu. */
export function Passeport({ etats, onRetour }: { etats: EtatEtape[]; onRetour: () => void }) {
  const obtenus = etats.filter((e) => e.tampon).length
  const zellige = useZellige()
  return (
    <Page titre="Mon passeport" retour={{ libelle: 'Parcours', action: onRetour }}>
      <p className="t-appel mb-6 px-marge text-texte-2">
        {obtenus === 0
          ? 'Chaque étape te donne un tampon quand tu retiens 80 % de ses mots. Commence par Tanger !'
          : `${obtenus} tampon${obtenus > 1 ? 's' : ''} sur ${ETAPES.length}. Continue le voyage !`}
      </p>
      <div
        className={`mb-10 rounded-carte ${zellige ? 'p-[14px]' : ''}`}
        style={zellige ? { ...fondZellige(zellige, 14), backgroundPosition: 'top left', backgroundColor: 'var(--zellige-fond)' } : undefined}
      >
        <div className={`grid grid-cols-2 gap-x-4 gap-y-6 bg-carte p-marge ${zellige ? 'rounded-[calc(var(--radius-carte)-14px)]' : 'rounded-carte'}`}>
          {etats.map((e, i) => (
            <div key={e.etape.id} className="flex flex-col items-center text-center">
              <Tampon ville={e.etape.ville} encre={ENCRES[i % ENCRES.length]} obtenu={e.tampon} angle={i % 2 === 0 ? -8 : 6} />
              <span className={`t-note mt-1 ${e.tampon ? 'font-semibold' : 'text-texte-2'}`}>
                {e.tampon ? 'Tampon obtenu' : `${e.retenus}/${Math.ceil(e.total * 0.8)} mots retenus`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}
