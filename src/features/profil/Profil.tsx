import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'

export function Profil() {
  const profil = useProfil()

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Profil</h2>
      <label className="flex min-h-14 items-center justify-between gap-4 rounded-3xl px-5 py-3 verre">
        <span>
          <span className="block font-semibold">Afficher l'écriture arabe</span>
          <span className="text-sm text-stone-500">À côté des lettres latines</span>
        </span>
        <input
          type="checkbox"
          checked={profil.afficherArabe}
          onChange={(e) => void modifierProfil({ afficherArabe: e.target.checked })}
          className="h-6 w-6 accent-orange-600"
        />
      </label>
      <p className="text-center text-sm text-stone-500">Les autres réglages arrivent aux jalons suivants.</p>
    </section>
  )
}
