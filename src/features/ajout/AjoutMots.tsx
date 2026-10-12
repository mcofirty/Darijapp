import { Send, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { MOTS } from '../../data'
import { lienDeMot, motValide, validerMot, type ChampsMot } from '../../data/motsPerso'
import { ajouterMot, lireMotsPerso, modifierMot, supprimerMot } from '../../db/motsPerso'
import { Bouton, Vide } from '../../ui/Boutons'
import { Ligne, Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { BoutonAudio } from '../mots/BoutonAudio'

const VIDE: ChampsMot = { latin: '', arabe: '', fr: '' }

interface ChampProps {
  libelle: string
  valeur: string
  erreur?: string
  arabe?: boolean
  onChange: (v: string) => void
}

function Champ({ libelle, valeur, erreur, arabe = false, onChange }: ChampProps) {
  return (
    <label className="block px-4 py-2">
      <span className="t-note uppercase text-texte-2">{libelle}</span>
      <input
        data-sans-balayage
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        dir={arabe ? 'rtl' : 'ltr'}
        lang={arabe ? 'ar' : undefined}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`block min-h-11 w-full bg-transparent outline-none ${arabe ? 'arabe text-[1.4rem]' : 't-corps'}`}
      />
      {erreur && <span className="t-note block text-accent">{erreur}</span>}
    </label>
  )
}

/** Page cachée (lien « #ajout ») : ajouter, modifier et supprimer ses propres mots. */
export function AjoutMots() {
  const mots = useLiveQuery(() => lireMotsPerso(), [])
  const [champs, setChamps] = useState<ChampsMot>(VIDE)
  const [enEdition, setEnEdition] = useState<string | null>(null)
  const [afficheErreurs, setAfficheErreurs] = useState(false)
  const erreurs = afficheErreurs ? validerMot(champs) : {}

  function maj(cle: keyof ChampsMot, valeur: string) {
    setChamps((c) => ({ ...c, [cle]: valeur }))
  }

  function reinitialiser() {
    setChamps(VIDE)
    setEnEdition(null)
    setAfficheErreurs(false)
  }

  /** Feuille de partage de l'iPhone (Messages, WhatsApp…) ; à défaut, copie le lien. */
  async function partager(mot: ChampsMot) {
    const url = lienDeMot(window.location.href, mot)
    const texte = `Un mot pour ton darija : ${mot.latin} = ${mot.fr}`
    try {
      if (navigator.share) await navigator.share({ text: texte, url })
      else {
        await navigator.clipboard.writeText(`${texte}\n${url}`)
        window.alert('Lien copié. Colle-le dans un message.')
      }
    } catch {
      // Partage annulé : rien à faire.
    }
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    if (!motValide(champs)) {
      setAfficheErreurs(true)
      return
    }
    if (enEdition) await modifierMot(enEdition, champs)
    else await ajouterMot(champs)
    reinitialiser()
  }

  return (
    <Page titre="Mes mots">
      <p className="t-corps mb-8">
        Bonjour Rim, bienvenue sur l’application pour aider Romain à apprendre le darija.
        <br />
        Tu veux ajouter un mot ?
      </p>
      <form onSubmit={envoyer}>
        <Section
          titre={enEdition ? 'Modifier le mot' : 'Nouveau mot'}
          note="Les trois champs sont obligatoires. Écris 3 pour ع, 7 pour ح, 9 pour ق, kh pour خ, gh pour غ et ch pour ش."
        >
          <Champ libelle="En français" valeur={champs.fr} erreur={erreurs.fr} onChange={(v) => maj('fr', v)} />
          <Champ libelle="Écriture latine (ex. 3afak)" valeur={champs.latin} erreur={erreurs.latin} onChange={(v) => maj('latin', v)} />
          <Champ libelle="Écriture arabe (ex. عافاك)" valeur={champs.arabe} erreur={erreurs.arabe} arabe onChange={(v) => maj('arabe', v)} />
        </Section>
        <div className="mb-8 flex flex-col gap-3">
          <Bouton type="submit" grand>
            {enEdition ? 'Enregistrer' : 'Ajouter'}
          </Bouton>
          {enEdition && (
            <Bouton variante="gris" grand onClick={reinitialiser}>
              Annuler
            </Bouton>
          )}
        </div>
      </form>

      {mots && mots.length === 0 && (
        <Vide icone={null} titre="Aucun mot ajouté" texte="Les mots que tu ajoutes arrivent en tête de tes prochaines sessions." />
      )}
      {mots && mots.length > 0 && (
        <Section
          titre={`${mots.length} mot${mots.length > 1 ? 's' : ''} ajouté${mots.length > 1 ? 's' : ''}`}
          note="Touche un mot pour le corriger. Quand il est bon, touche l’avion en papier pour l’envoyer à Romain."
        >
          {mots.map((m) => (
            <Ligne
              key={m.id}
              onClick={() => {
                setEnEdition(m.id)
                setChamps({ latin: m.latin, arabe: m.arabe, fr: m.fr })
                setAfficheErreurs(false)
                window.scrollTo(0, 0)
              }}
              titre={<span className="font-semibold">{m.latin}</span>}
              sousTitre={m.fr}
              valeur={
                <span className="arabe text-[1.15rem]" dir="rtl" lang="ar">
                  {m.arabe}
                </span>
              }
              fin={
                <span className="flex items-center gap-1">
                  <BoutonAudio chemin={`audio/${m.id}.mp3`} arabe={m.arabe} libelle="" />
                  <button
                    type="button"
                    aria-label={`Envoyer ${m.latin} à Romain`}
                    className="pressable flex h-11 w-11 items-center justify-center text-accent"
                    onClick={() => void partager(m)}
                  >
                    <Send className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Supprimer ${m.latin}`}
                    className="pressable flex h-11 w-11 items-center justify-center text-accent"
                    onClick={() => {
                      if (window.confirm(`Supprimer « ${m.latin} » et sa progression ?`)) void supprimerMot(m.id)
                    }}
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </span>
              }
            />
          ))}
        </Section>
      )}
      <Section
        titre={`${MOTS.length} mots de l'application`}
        note="Ces mots font partie du programme : ils ne peuvent pas être modifiés ni supprimés ici."
      >
        {MOTS.map((m) => (
          <Ligne
            key={m.id}
            titre={<span className="font-semibold">{m.latin}</span>}
            sousTitre={m.fr}
            valeur={
              <span className="arabe text-[1.15rem]" dir="rtl" lang="ar">
                {m.arabe}
              </span>
            }
          />
        ))}
      </Section>
    </Page>
  )
}
