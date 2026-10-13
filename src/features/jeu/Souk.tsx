import { Check, Coins } from 'lucide-react'
import { useState } from 'react'
import { acheter, choisir, usePorteMonnaie } from '../../db/souk'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { ARTICLES, DH_PAR_BONNE_REPONSE, DH_PAR_THEIERE, DH_PAR_TRESOR, possede, type Article, type Categorie } from '../../gamification/souk'
import { Alerte } from '../../ui/Alerte'
import { Ligne, Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { Plante, motifZellige } from './Plante'

const RAYONS: { categorie: Categorie; titre: string; note: string }[] = [
  { categorie: 'couleur', titre: 'Couleurs de l’appli', note: 'Remplace le rouge des boutons et des accents. Les erreurs restent en rouge.' },
  { categorie: 'zellige', titre: 'Zellige de la carte du jour', note: 'Un motif en haut de la carte « Session du jour ».' },
  { categorie: 'pot', titre: 'Pots pour ta plante', note: 'Ta plante pousse avec ton niveau, de Terreau à Arbre.' },
]

function Apercu({ a, niveau }: { a: Article; niveau: number }) {
  if (a.categorie === 'pot') return <Plante niveau={Math.max(niveau, 4)} pot={a.id} taille={36} />
  const motif = a.categorie === 'zellige' ? motifZellige(a.id) : undefined
  return (
    <span
      className="block h-9 w-9 shrink-0 rounded-full border border-separateur"
      style={{ background: motif ? `${motif} center / 18px` : a.apercu, backgroundColor: motif ? 'var(--carte)' : a.apercu }}
      aria-hidden
    />
  )
}

/** Le souk : on y dépense ses dirhams en décor. Rien d'utile à l'apprentissage ne s'y achète. */
export function Souk({ onRetour }: { onRetour: () => void }) {
  const { solde, achats } = usePorteMonnaie()
  const profil = useProfil()
  const { niveau } = useResume()
  const [confirmer, setConfirmer] = useState<Article | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function toucher(a: Article) {
    if (possede(a.id, achats)) void choisir(a.categorie, a.id)
    else setConfirmer(a)
  }

  return (
    <Page titre="Le souk" retour={{ libelle: 'Apprendre', action: onRetour }}>
      <section className="mb-[26px] flex items-center gap-4 rounded-liste bg-carte p-marge">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffcc00] text-white" aria-hidden>
          <Coins className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <span className="min-w-0">
          <span className="t-titre-1 block">{solde} DH</span>
          <span className="t-sous-titre block text-texte-2">
            {DH_PAR_BONNE_REPONSE} DH par bonne réponse, {DH_PAR_THEIERE} par théière, {DH_PAR_TRESOR} par trésor.
          </span>
        </span>
      </section>

      {RAYONS.map((r) => (
        <Section key={r.categorie} titre={r.titre} note={r.note}>
          {ARTICLES.filter((a) => a.categorie === r.categorie).map((a) => {
            const choisi = profil[a.categorie] === a.id
            const aMoi = possede(a.id, achats)
            return (
              <Ligne
                key={a.id}
                tuile={<Apercu a={a} niveau={niveau.niveau} />}
                titre={a.nom}
                sousTitre={a.description}
                valeur={
                  choisi ? (
                    <span className="flex items-center gap-1 font-semibold text-vert">
                      <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> Choisi
                    </span>
                  ) : aMoi ? (
                    'À toi'
                  ) : (
                    <span className={solde >= a.prix ? 'font-semibold text-accent' : ''}>{a.prix} DH</span>
                  )
                }
                onClick={() => toucher(a)}
              />
            )
          })}
        </Section>
      ))}

      {confirmer && (
        <Alerte
          titre={`${confirmer.nom} : ${confirmer.prix} DH`}
          message={solde >= confirmer.prix ? `Il te restera ${solde - confirmer.prix} DH.` : `Il te manque ${confirmer.prix - solde} DH. Continue à pratiquer !`}
          onAnnuler={() => setConfirmer(null)}
          actions={
            solde >= confirmer.prix
              ? [
                  { libelle: 'Annuler', role: 'annuler', action: () => setConfirmer(null) },
                  {
                    libelle: 'Acheter',
                    action: () => {
                      const a = confirmer
                      setConfirmer(null)
                      void acheter(a.id).then((e) => e && setMessage(e))
                    },
                  },
                ]
              : [{ libelle: 'OK', role: 'annuler', action: () => setConfirmer(null) }]
          }
        />
      )}
      {message && <Alerte titre={message} onAnnuler={() => setMessage(null)} actions={[{ libelle: 'OK', action: () => setMessage(null) }]} />}
    </Page>
  )
}
