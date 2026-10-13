import { CloudDownload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { audiosManquants, audiosPresents, telechargerAudios } from '../../audio/horsLigne'
import { demanderStockagePersistant } from '../../app/stockage'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Section, Tuile } from '../../ui/Liste'

const TOUS = __AUDIOS__
const nombre = (n: number) => n.toLocaleString('fr-FR')

/** Taille approximative de `n` fichiers, d'après le poids moyen des MP3. */
function taille(n: number): string {
  const mo = (__TAILLE_AUDIO__ / Math.max(1, TOUS.length)) * n / 1e6
  return mo < 1 ? 'moins de 1 Mo' : `${Math.round(mo)} Mo`
}

/** « Audio hors ligne » : télécharge d'un coup toutes les voix de Jamal, pour ne plus dépendre du réseau. */
export function AudioHorsLigne() {
  const [manquants, setManquants] = useState<string[] | null>(null)
  const [progres, setProgres] = useState<{ faits: number; total: number } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const arret = useRef<AbortController | null>(null)

  async function compter() {
    setManquants(audiosManquants(TOUS, await audiosPresents()))
  }

  useEffect(() => {
    if (!('caches' in window)) return
    void compter()
    return () => arret.current?.abort()
  }, [])

  async function telecharger(liste: string[]) {
    arret.current = new AbortController()
    setProgres({ faits: 0, total: liste.length })
    void demanderStockagePersistant()
    try {
      const echecs = await telechargerAudios(liste, (faits) => setProgres({ faits, total: liste.length }), arret.current.signal)
      if (echecs > 0 && !arret.current.signal.aborted)
        setMessage(`${nombre(echecs)} fichier${echecs > 1 ? 's' : ''} n’${echecs > 1 ? 'ont' : 'a'} pas pu être téléchargé${echecs > 1 ? 's' : ''}. Réessaie en Wi-Fi.`)
    } catch (e) {
      setMessage(`Le téléchargement n’a pas abouti (${(e as Error).message}).`)
    } finally {
      setProgres(null)
      await compter()
    }
  }

  if (manquants === null || TOUS.length === 0) return null
  const presents = TOUS.length - manquants.length
  const complet = manquants.length === 0
  return (
    <Section
      titre="Audio hors ligne"
      note="Sans téléchargement, chaque voix est gardée sur l’iPhone à sa première écoute ; hors ligne, un mot jamais écouté est lu par la voix de l’iPhone, en arabe standard."
    >
      <Ligne
        tuile={<Tuile icone={CloudDownload} couleur="#30b0c7" />}
        titre="Voix de Jamal sur l’iPhone"
        sousTitre={
          progres
            ? `Téléchargement : ${nombre(progres.faits)} sur ${nombre(progres.total)}`
            : complet
              ? 'Tout l’audio marche hors ligne'
              : `${nombre(presents)} fichiers sur ${nombre(TOUS.length)}`
        }
        valeur={complet && !progres ? 'Fait' : undefined}
      />
      {progres && (
        <div className="sans-separateur px-marge pb-4">
          <div className="h-2 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <div
              className="h-full rounded-full bg-accent-plein transition-[width] duration-300"
              style={{ width: `${(progres.faits / Math.max(1, progres.total)) * 100}%` }}
            />
          </div>
          <button type="button" onClick={() => arret.current?.abort()} className="pressable t-appel mt-2 min-h-11 text-accent">
            Arrêter le téléchargement
          </button>
        </div>
      )}
      {!progres && !complet && (
        <Ligne
          titre={
            <span className="text-accent">
              {presents === 0 ? `Tout télécharger (${taille(manquants.length)})` : `Télécharger les ${nombre(manquants.length)} manquants (${taille(manquants.length)})`}
            </span>
          }
          onClick={() => void telecharger(manquants)}
        />
      )}
      {message && <Alerte titre={message} onAnnuler={() => setMessage(null)} actions={[{ libelle: 'OK', action: () => setMessage(null) }]} />}
    </Section>
  )
}
