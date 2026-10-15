import { AudioLines, Ear, Flag, Languages, Mic, Speech, SunMoon, UserRound, Gauge } from 'lucide-react'
import { useState } from 'react'
import { modifierProfil, reglerMode, type Apparence } from '../../db/db'
import { useModes, useProfil } from '../../db/useProfil'
import { Interrupteur, Segmente } from '../../ui/Boutons'
import { Ligne, Section, Tuile } from '../../ui/Liste'
import { useMarques } from '../../db/marques'
import { Page } from '../../ui/Page'
import { MotsSignales } from './MotsSignales'
import { AudioHorsLigne } from './AudioHorsLigne'
import { RappelEtSauvegarde } from './RappelEtSauvegarde'
import { ReglageVoix } from './ReglageVoix'
import { TestNiveau } from '../onboarding/TestNiveau'
import { ScorePrecis } from './ScorePrecis'
import { MonAvatar } from './MonAvatar'
import { Avatar } from '../../ui/Avatar'

const APPARENCES: { id: Apparence; libelle: string }[] = [
  { id: 'systeme', libelle: 'Automatique' },
  { id: 'clair', libelle: 'Clair' },
  { id: 'sombre', libelle: 'Sombre' },
]

const GENRES: { id: 'm' | 'f'; libelle: string }[] = [
  { id: 'm', libelle: 'Masculin' },
  { id: 'f', libelle: 'Féminin' },
]

/** Sous-titre d'un mode : coupé pour un moment par « Je ne peux pas… maintenant », ou le réglage. */
function etatDuMode(actif: boolean, pause: number | null, allume: string): string {
  if (!actif) return 'Coupés'
  if (pause !== null && pause > Date.now()) {
    const fin = new Date(pause)
    return `Coupés jusqu’à ${fin.getHours()} h ${String(fin.getMinutes()).padStart(2, '0')}`
  }
  return allume
}

export function Profil() {
  const profil = useProfil()
  // Redessine à la fin d'une pause de 15 min (sous-titres « Coupés jusqu'à… »).
  useModes()
  const [signales, setSignales] = useState(false)
  const [reglage, setReglage] = useState(false)
  const [test, setTest] = useState(false)
  const [avatar, setAvatar] = useState(false)
  const nbSignales = [...useMarques().values()].filter((m) => m.signale).length
  if (signales) return <MotsSignales onRetour={() => setSignales(false)} />
  if (reglage) return <ReglageVoix onRetour={() => setReglage(false)} />
  if (test) return <TestNiveau onRetour={() => setTest(false)} />
  if (avatar) return <MonAvatar onRetour={() => setAvatar(false)} />
  return (
    <Page titre="Profil">
      <Section>
        <Ligne
          tuile={<Avatar visage={profil.avatar} fond={profil.avatarFond} taille={60} />}
          titre={<span className="t-titre-3">{profil.prenom.trim() || 'Ton prénom'}</span>}
          sousTitre="Avatar et prénom"
          chevron
          onClick={() => setAvatar(true)}
        />
      </Section>
      <Section titre="Apparence" arrondi="rounded-segmente" note="Automatique suit le réglage clair ou sombre de l'iPhone.">
        <Ligne tuile={<Tuile icone={SunMoon} couleur="#5856d6" />} titre="Thème" />
        <div className="sans-separateur px-marge pb-marge">
          <Segmente options={APPARENCES} valeur={profil.apparence} onChange={(v) => void modifierProfil({ apparence: v })} />
        </div>
      </Section>
      <Section
        titre="Moi"
        arrondi="rounded-segmente"
        note="Accorde les phrases où tu parles de toi ou où l’on s’adresse à toi : « nta » ou « nti », « mghribi » ou « mghribiya »."
      >
        <Ligne tuile={<Tuile icone={UserRound} couleur="#ff9500" />} titre="Genre" />
        <div className="sans-separateur px-marge pb-marge">
          <Segmente options={GENRES} valeur={profil.genre ?? 'm'} onChange={(v) => void modifierProfil({ genre: v })} />
        </div>
      </Section>
      <Section titre="Affichage">
        <Ligne
          tuile={<Tuile icone={Languages} couleur="#006233" />}
          titre="Écriture arabe"
          sousTitre="À côté des lettres latines"
          fin={
            <Interrupteur
              libelle="Afficher l'écriture arabe"
              actif={profil.afficherArabe}
              onChange={(v) => void modifierProfil({ afficherArabe: v })}
            />
          }
        />
      </Section>
      <Section
        titre="Exercices"
        note="Pour jouer sans parler ou sans le son : les exercices concernés sont retirés des sessions, quiz et leçons. Pendant une activité, « Je ne peux pas parler maintenant » ou « Je ne peux pas écouter maintenant » les coupe 15 min."
      >
        <Ligne
          tuile={<Tuile icone={Speech} couleur="#ff9500" />}
          titre="Exercices de prononciation"
          sousTitre={etatDuMode(profil.parler, profil.pauseParler, 'Dis-le et Dis-le en darija')}
          fin={<Interrupteur libelle="Exercices de prononciation" actif={profil.parler} onChange={(v) => void reglerMode('parler', v)} />}
        />
        <Ligne
          tuile={<Tuile icone={Ear} couleur="#007aff" />}
          titre="Exercices d’écoute"
          sousTitre={etatDuMode(profil.ecouter, profil.pauseEcouter, 'Écoute, sons et lecture automatique')}
          fin={<Interrupteur libelle="Exercices d’écoute" actif={profil.ecouter} onChange={(v) => void reglerMode('ecouter', v)} />}
        />
      </Section>
      <Section titre="Prononciation" note="Sans micro, l’exercice Dis-le te laisse juger toi-même. Ta voix n’est jamais gardée ni envoyée : elle est analysée sur l’iPhone puis oubliée.">
        <Ligne
          tuile={<Tuile icone={Mic} couleur="#ff2d55" />}
          titre="Micro"
          sousTitre={profil.micro ? 'Score de prononciation' : 'Mode sans micro'}
          fin={<Interrupteur libelle="Utiliser le micro" actif={profil.micro} onChange={(v) => void modifierProfil({ micro: v })} />}
        />
        {profil.micro && (
          <Ligne
            tuile={<Tuile icone={AudioLines} couleur="#5856d6" />}
            titre="Régler le score sur ma voix"
            valeur={profil.reglageVoix.length > 0 ? 'Fait' : 'À faire'}
            chevron
            onClick={() => setReglage(true)}
          />
        )}
        {profil.micro && <ScorePrecis />}
      </Section>
      <AudioHorsLigne />
      <RappelEtSauvegarde />
      <Section titre="Niveau" note="Le test fait passer en révision les mots que tu connais déjà ; on peut le refaire à tout moment.">
        <Ligne tuile={<Tuile icone={Gauge} couleur="#5856d6" />} titre="Test de niveau" valeur={profil.testNiveau === 'fait' ? 'Fait' : undefined} chevron onClick={() => setTest(true)} />
      </Section>
      <Section titre="Contenu">
        <Ligne
          tuile={<Tuile icone={Flag} couleur="#ff9500" />}
          titre="Mots signalés"
          valeur={nbSignales}
          chevron
          onClick={() => setSignales(true)}
        />
      </Section>
    </Page>
  )
}
