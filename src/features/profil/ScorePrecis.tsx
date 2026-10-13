import { Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { infosModele, modelePresent, supprimerModele, telechargerModele } from '../../audio/modeleSons'
import { modifierProfil } from '../../db/db'
import { useProfil } from '../../db/useProfil'
import { Alerte } from '../../ui/Alerte'
import { Interrupteur } from '../../ui/Boutons'
import { Ligne, Tuile } from '../../ui/Liste'

/** Taille arrondie en Mo, pour les messages. */
const enMo = (octets: number) => `${Math.round(octets / 1e6)} Mo`

/**
 * « Score précis (expérimental) » : télécharge le modèle de reconnaissance des sons (une fois, environ 370 Mo),
 * puis Dis-le note chaque son du mot au lieu de comparer le timbre de la voix.
 */
export function ScorePrecis() {
  const profil = useProfil()
  const [present, setPresent] = useState<boolean | null>(null)
  const [taille, setTaille] = useState(366e6)
  const [progres, setProgres] = useState<number | null>(null)
  const [demande, setDemande] = useState<'telecharger' | 'supprimer' | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const arret = useRef<AbortController | null>(null)

  useEffect(() => {
    void modelePresent().then(setPresent)
    void infosModele()
      .then((i) => setTaille(i.taille + 11e6))
      .catch(() => {})
    return () => arret.current?.abort()
  }, [])

  async function telecharger() {
    setDemande(null)
    setErreur(null)
    arret.current = new AbortController()
    setProgres(0)
    try {
      await telechargerModele(setProgres, arret.current.signal)
      setPresent(true)
      await modifierProfil({ scorePrecis: true })
    } catch (e) {
      if (!arret.current.signal.aborted) setErreur(`Le téléchargement n’a pas abouti (${(e as Error).message}). Réessaie en Wi-Fi.`)
    } finally {
      setProgres(null)
    }
  }

  function basculer(actif: boolean) {
    if (!actif) return void modifierProfil({ scorePrecis: false })
    if (present) return void modifierProfil({ scorePrecis: true })
    setDemande('telecharger')
  }

  const actif = profil.scorePrecis && !!present
  return (
    <>
      <Ligne
        tuile={<Tuile icone={Sparkles} couleur="#af52de" />}
        titre="Score précis (expérimental)"
        sousTitre={
          progres !== null
            ? `Téléchargement : ${Math.round(progres * 100)} %`
            : present
              ? 'Note chaque son du mot'
              : `Modèle à télécharger (${enMo(taille)})`
        }
        fin={<Interrupteur libelle="Score précis" actif={actif || progres !== null} onChange={basculer} />}
      />
      {progres !== null && (
        <div className="sans-separateur px-marge pb-4">
          <div className="h-2 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <div className="h-full rounded-full bg-accent-plein transition-[width] duration-300" style={{ width: `${progres * 100}%` }} />
          </div>
          <button type="button" onClick={() => arret.current?.abort()} className="pressable t-appel mt-2 min-h-11 text-accent">
            Arrêter le téléchargement
          </button>
        </div>
      )}
      {present && progres === null && (
        <button type="button" onClick={() => setDemande('supprimer')} className="pressable t-corps min-h-ligne w-full px-marge text-left text-rouge">
          Supprimer le modèle de l’iPhone
        </button>
      )}
      {demande === 'telecharger' && (
        <Alerte
          titre="Télécharger le modèle ?"
          message={`Le score précis utilise un modèle qui reconnaît les sons (${enMo(taille)}, à télécharger une fois, en Wi-Fi de préférence). Il tourne sur l’iPhone : ta voix ne part nulle part. Chaque essai demande quelques secondes de calcul.`}
          onAnnuler={() => setDemande(null)}
          actions={[
            { libelle: 'Annuler', role: 'annuler', action: () => setDemande(null) },
            { libelle: 'Télécharger', action: () => void telecharger() },
          ]}
        />
      )}
      {demande === 'supprimer' && (
        <Alerte
          titre="Supprimer le modèle ?"
          message="Le score revient à la comparaison avec la voix de Jamal. Tu pourras le retélécharger."
          onAnnuler={() => setDemande(null)}
          actions={[
            { libelle: 'Annuler', role: 'annuler', action: () => setDemande(null) },
            {
              libelle: 'Supprimer',
              role: 'destructif',
              action: () => {
                setDemande(null)
                void supprimerModele().then(() => {
                  setPresent(false)
                  void modifierProfil({ scorePrecis: false })
                })
              },
            },
          ]}
        />
      )}
      {erreur && <Alerte titre={erreur} onAnnuler={() => setErreur(null)} actions={[{ libelle: 'OK', action: () => setErreur(null) }]} />}
    </>
  )
}
