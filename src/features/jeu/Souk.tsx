import { Check, Coins, Eye, EyeOff, Lamp, Bird, CupSoda, Volume2, PartyPopper } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apercuSons } from '../../audio/effets'
import { acheter, choisir, usePorteMonnaie } from '../../db/souk'
import { useProfil } from '../../db/useProfil'
import { useResume } from '../../db/useResume'
import { croissance } from '../../gamification/jardin'
import { ARTICLES, BONUS_PRECISION, DH_PAR_BONNE_REPONSE, DH_PAR_THEIERE, DH_PAR_TRESOR, possede, type Article, type Categorie } from '../../gamification/souk'
import { Alerte, type ActionAlerte } from '../../ui/Alerte'
import { PluieConfettis } from '../session/Bilan'
import { Segmente } from '../../ui/Boutons'
import { Ligne, Section } from '../../ui/Liste'
import { Page } from '../../ui/Page'
import { Plante, motifZellige } from './Plante'

type Allee = 'jardin' | 'appli'

const RAYONS: { allee: Allee; categorie: Categorie; titre: string; note: string }[] = [
  { allee: 'jardin', categorie: 'espece', titre: 'Plantes', note: 'Ta plante garde ses progrès : elle change d’espèce, pas de taille.' },
  { allee: 'jardin', categorie: 'fond', titre: 'Décors', note: 'Le fond de « Mon jardin ».' },
  { allee: 'jardin', categorie: 'objet', titre: 'Objets', note: 'Autour du pot. Touche un objet à toi pour l’afficher ou le ranger.' },
  { allee: 'jardin', categorie: 'pot', titre: 'Pots', note: 'Ta plante pousse avec ton niveau, de Terreau à Arbre.' },
  { allee: 'appli', categorie: 'couleur', titre: 'Couleurs de l’appli', note: 'Remplace le rouge des boutons et des accents. Les erreurs restent en rouge.' },
  { allee: 'appli', categorie: 'sons', titre: 'Sons des réponses', note: 'Touche un jeu de sons pour l’écouter.' },
  { allee: 'appli', categorie: 'confettis', titre: 'Confettis du bilan', note: 'Ce qui tombe à la fin d’une session ou d’un quiz.' },
  { allee: 'appli', categorie: 'zellige', titre: 'Zellige de la carte du jour', note: 'Un motif en haut de la carte « Session du jour ».' },
]

const ICONES_OBJETS: Record<string, typeof Lamp> = { lanterne: Lamp, theiere: CupSoda, cigogne: Bird }

function Apercu({ a, stade, espece, pot }: { a: Article; stade: number; espece: string; pot: string }) {
  // Les plantes et les pots se montrent au stade Fleur (ou plus, si la plante y est déjà).
  const s = Math.max(stade, 8)
  if (a.categorie === 'pot') return <Plante stade={s} espece={espece} pot={a.id} taille={36} />
  if (a.categorie === 'espece') return <Plante stade={s} espece={a.id} pot={pot} taille={36} />
  const Icone = a.categorie === 'objet' ? ICONES_OBJETS[a.id] : a.categorie === 'sons' ? Volume2 : a.categorie === 'confettis' ? PartyPopper : null
  if (Icone)
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: a.apercu === '#f2f2f2' ? '#8e8e93' : a.apercu }} aria-hidden>
        <Icone className="h-5 w-5" strokeWidth={2.2} />
      </span>
    )
  const motif = a.categorie === 'zellige' ? motifZellige(a.id) : undefined
  return (
    <span
      className="block h-9 w-9 shrink-0 rounded-full border border-separateur"
      style={{ background: motif ? `${motif} center / 18px` : a.apercu, backgroundColor: motif ? 'var(--carte)' : a.apercu }}
      aria-hidden
    />
  )
}

/** Rayons de l'allée « L'appli » : un article pas encore acheté s'y essaie pendant que la fenêtre d'achat est ouverte. */
const A_ESSAYER: Categorie[] = ['couleur', 'sons', 'confettis', 'zellige']

/** Aperçu dans la fenêtre d'achat : la carte « Session du jour » avec son zellige. */
function ApercuZellige({ id }: { id: string }) {
  const motif = motifZellige(id)
  return (
    <div className="mb-4 overflow-hidden rounded-[18px] bg-carte text-left" aria-hidden>
      {motif && <div className="h-10 opacity-80" style={{ background: `${motif} center / 28px` }} />}
      <p className="t-note px-3 pb-2 pt-2 font-semibold uppercase text-accent">Session du jour</p>
    </div>
  )
}

/** Le souk : on y dépense ses dirhams en décor (jardin et appli). Rien d'utile à l'apprentissage ne s'y achète. */
export function Souk({ retour }: { retour: { libelle: string; action: () => void } }) {
  const { solde, achats } = usePorteMonnaie()
  const profil = useProfil()
  const { xpTotal } = useResume()
  const { stade } = croissance(xpTotal)
  const [allee, setAllee] = useState<Allee>('jardin')
  const [confirmer, setConfirmer] = useState<Article | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  // Confettis en cours d'essai (la clé relance la pluie).
  const [pluie, setPluie] = useState<{ type: string; cle: number } | null>(null)
  const essai = confirmer && A_ESSAYER.includes(confirmer.categorie) ? confirmer : null
  const couleurChoisie = useRef(profil.couleur)
  couleurChoisie.current = profil.couleur
  const achete = useRef(false)

  // Essai d'une couleur : l'appli la prend tant que la fenêtre d'achat est ouverte, puis reprend la sienne
  // (sauf si l'article vient d'être acheté : il est alors choisi et appliqué par App).
  useEffect(() => {
    if (essai?.categorie !== 'couleur') return
    achete.current = false
    document.documentElement.dataset.couleur = essai.id
    return () => {
      if (!achete.current) document.documentElement.dataset.couleur = couleurChoisie.current
    }
  }, [essai])

  function essayer(a: Article) {
    if (a.categorie === 'sons') apercuSons(a.id)
    if (a.categorie === 'confettis') setPluie((p) => ({ type: a.id, cle: (p?.cle ?? 0) + 1 }))
  }

  function toucher(a: Article) {
    if (possede(a.id, achats)) {
      if (a.categorie === 'sons') apercuSons(a.id)
      void choisir(a.categorie, a.id)
      return
    }
    essayer(a)
    setConfirmer(a)
  }

  function fermer() {
    setConfirmer(null)
    setPluie(null)
  }

  /** Bouton pour rejouer l'aperçu d'un son ou de confettis. */
  const rejouer: ActionAlerte[] =
    essai && (essai.categorie === 'sons' || essai.categorie === 'confettis')
      ? [{ libelle: essai.categorie === 'sons' ? 'Réécouter' : 'Revoir', role: 'choix', action: () => essayer(essai) }]
      : []

  return (
    <Page titre="Le souk" retour={retour}>
      <section className="mb-[26px] flex items-center gap-4 rounded-liste bg-carte p-marge">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffcc00] text-white" aria-hidden>
          <Coins className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <span className="min-w-0">
          <span className="t-titre-1 block">{solde} DH</span>
          <span className="t-sous-titre block text-texte-2">
            {DH_PAR_BONNE_REPONSE} DH par bonne réponse, +{BONUS_PRECISION[0]} sans faute (+{BONUS_PRECISION[1]} avec une erreur, +
            {BONUS_PRECISION[2]} avec deux), {DH_PAR_THEIERE} par théière, {DH_PAR_TRESOR} par trésor.
          </span>
        </span>
      </section>

      <div className="mb-[26px]">
        <Segmente
          options={[
            { id: 'jardin', libelle: 'Mon jardin' },
            { id: 'appli', libelle: 'L’appli' },
          ]}
          valeur={allee}
          onChange={setAllee}
        />
      </div>

      {RAYONS.filter((r) => r.allee === allee).map((r) => (
        <Section key={r.categorie} titre={r.titre} note={r.note}>
          {ARTICLES.filter((a) => a.categorie === r.categorie).map((a) => {
            const choisi = a.categorie === 'objet' ? profil.objets.includes(a.id) : profil[a.categorie] === a.id
            const aMoi = possede(a.id, achats)
            return (
              <Ligne
                key={a.id}
                tuile={<Apercu a={a} stade={stade} espece={profil.espece} pot={profil.pot} />}
                titre={a.nom}
                sousTitre={a.description}
                valeur={
                  a.categorie === 'objet' && aMoi ? (
                    <span className={`flex items-center gap-1 ${choisi ? 'font-semibold text-vert' : ''}`}>
                      {choisi ? <Eye className="h-4 w-4" strokeWidth={2.6} aria-hidden /> : <EyeOff className="h-4 w-4" strokeWidth={2.6} aria-hidden />}
                      {choisi ? 'Affiché' : 'Rangé'}
                    </span>
                  ) : choisi ? (
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
          apercu={essai?.categorie === 'zellige' ? <ApercuZellige id={essai.id} /> : undefined}
          message={[
            essai ? 'Aperçu : il disparaît si tu n’achètes pas.' : '',
            solde >= confirmer.prix ? `Il te restera ${solde - confirmer.prix} DH.` : `Il te manque ${confirmer.prix - solde} DH. Continue à pratiquer !`,
          ]
            .filter(Boolean)
            .join(' ')}
          onAnnuler={fermer}
          actions={
            solde >= confirmer.prix
              ? [
                  ...rejouer,
                  { libelle: 'Annuler', role: 'annuler', action: fermer },
                  {
                    libelle: 'Acheter',
                    action: () => {
                      const a = confirmer
                      void acheter(a.id).then((e) => {
                        if (e) setMessage(e)
                        else achete.current = true
                        fermer()
                      })
                    },
                  },
                ]
              : [...rejouer, { libelle: 'OK', role: 'annuler', action: fermer }]
          }
        />
      )}
      {pluie && createPortal(<PluieConfettis key={pluie.cle} type={pluie.type} classe="fixed inset-0 z-[60]" />, document.body)}
      {message && <Alerte titre={message} onAnnuler={() => setMessage(null)} actions={[{ libelle: 'OK', action: () => setMessage(null) }]} />}
    </Page>
  )
}
