import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motsDuTheme } from '../../data'
import { THEMES } from '../../data/themes'
import { useResume } from '../../db/useResume'
import { ordonnerThemes } from '../../exercices/selections'
import { VISUELS_THEMES } from '../../ui/visuels'

/** Thèmes et identifiants de leurs mots, calculés une fois. */
const MOTS_DES_THEMES = THEMES.map((t) => ({ id: t.id, mots: motsDuTheme(t.id).map((m) => m.id) }))

/** Titre de bloc de l'accueil, avec un lien à droite (« Tout voir »). */
export function TitreBloc({ titre, lien }: { titre: string; lien?: { libelle: string; action: () => void } }) {
  return (
    <div className="mb-2 flex items-baseline justify-between px-marge">
      <h2 className="t-gras text-texte-2">{titre}</h2>
      {lien && (
        <button type="button" onClick={lien.action} className="pressable t-appel -my-2 py-2 font-semibold text-accent">
          {lien.libelle}
        </button>
      )}
    </div>
  )
}

export interface Raccourci {
  id: string
  titre: string
  detail: string
  icone: LucideIcon
  couleur: string
  /** Pastille en coin (mots difficiles à revoir). */
  badge?: number
  action: () => void
}

/** Grille de grandes tuiles colorées : ce qu'on peut pratiquer, à portée de pouce. */
export function GrillePratiquer({ raccourcis }: { raccourcis: Raccourci[] }) {
  return (
    <section className="mb-[26px]">
      <TitreBloc titre="Pratiquer" />
      <div className="grid grid-cols-3 gap-2.5">
        {raccourcis.map(({ id, titre, detail, icone: Icone, couleur, badge, action }) => (
          <button
            key={id}
            type="button"
            onClick={action}
            className="pressable relative flex min-h-[104px] flex-col items-start justify-between rounded-[22px] bg-carte p-3 text-left"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white"
              style={{ background: couleur, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 3px 6px -3px var(--ombre-relief)' }}
              aria-hidden
            >
              <Icone className="h-[22px] w-[22px]" strokeWidth={2.2} />
            </span>
            <span className="mt-2 block w-full min-w-0">
              <span className="t-appel block font-semibold leading-tight">{titre}</span>
              <span className="t-note block truncate text-texte-2">{detail}</span>
            </span>
            {badge !== undefined && badge > 0 && (
              <span className="t-note absolute right-2.5 top-2.5 min-w-[22px] rounded-full bg-[var(--accent-plein)] px-1.5 py-0.5 text-center font-semibold tabular-nums text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

/** Niveau en une ligne : plante, nom du palier, jauge vers le niveau suivant ; mène à « Mon jardin ». */
export function LigneNiveau({ plante, onClick }: { plante: ReactNode; onClick: () => void }) {
  const { niveau } = useResume()
  const reste = niveau.objectif - niveau.xp
  return (
    <section className="mb-[26px] overflow-hidden rounded-liste bg-carte">
      <button type="button" onClick={onClick} className="ligne-pressable flex w-full items-center gap-3 px-marge py-3 text-left">
        <span className="shrink-0">{plante}</span>
        <span className="min-w-0 flex-1">
          <span className="t-gras block truncate">
            Niv. {niveau.niveau} · {niveau.nom}
          </span>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-remplissage" aria-hidden>
            <span className="jauge block h-full rounded-full bg-energie-plein" style={{ width: `${(niveau.xp / niveau.objectif) * 100}%` }} />
          </span>
          <span className="t-note mt-1 block text-texte-2">
            {reste > 0 ? (
              <>
                Encore <span className="font-semibold text-energie">{reste} XP</span> · Mon jardin
              </>
            ) : (
              'Dernier niveau atteint · Mon jardin'
            )}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-texte-3" strokeWidth={2.4} aria-hidden />
      </button>
    </section>
  )
}

/** Thème en carré, pour la grille de la page « Thèmes » (3 par ligne) : icône, titre, mots vus et jauge. */
export function CarreTheme({ id, vus, total, onClick }: { id: string; vus: number; total: number; onClick: () => void }) {
  const theme = THEMES.find((t) => t.id === id)!
  const { icone: Icone, couleur } = VISUELS_THEMES[id]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${theme.titre} : ${vus} mots vus sur ${total}`}
      className="pressable flex aspect-square min-w-0 flex-col rounded-[20px] bg-carte p-2.5 text-left"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: couleur }} aria-hidden>
        <Icone className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <span className="t-note mt-1.5 line-clamp-2 break-words font-semibold leading-tight [hyphens:auto]">{theme.titre}</span>
      <span className="mt-auto block w-full">
        <span className="t-legende block tabular-nums text-texte-2">{vus > 0 ? `${vus}/${total}` : `${total} mots`}</span>
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
          <span className="block h-full rounded-full" style={{ width: `${(vus / total) * 100}%`, background: couleur }} />
        </span>
      </span>
    </button>
  )
}

/** Avancée de chaque thème (mots vus sur le total), dans l'ordre d'affichage : en cours d'abord. */
export function useAvanceeThemes() {
  const { motsVus } = useResume()
  return ordonnerThemes(MOTS_DES_THEMES, motsVus)
}

/** Un seul bouton pour les thèmes, sur l'accueil : les icônes des thèmes en cours, leur nombre ; il ouvre la grille. */
export function BoutonThemes({ onClick }: { onClick: () => void }) {
  const themes = useAvanceeThemes()
  const enCours = themes.filter((t) => t.vus > 0 && t.vus < t.total).length
  return (
    <section className="mb-[26px] overflow-hidden rounded-liste bg-carte">
      <button type="button" onClick={onClick} className="ligne-pressable flex w-full items-center gap-3 px-marge py-3 text-left">
        {/* Aperçu : les 4 premiers thèmes (en cours d'abord), en petite grille. */}
        <span className="grid shrink-0 grid-cols-2 gap-1" aria-hidden>
          {themes.slice(0, 4).map((t) => {
            const { icone: Icone, couleur } = VISUELS_THEMES[t.id]
            return (
              <span key={t.id} className="flex h-[19px] w-[19px] items-center justify-center rounded-[6px] text-white" style={{ background: couleur }}>
                <Icone className="h-3 w-3" strokeWidth={2.4} />
              </span>
            )
          })}
        </span>
        <span className="min-w-0 flex-1">
          <span className="t-gras block">Thèmes</span>
          <span className="t-sous-titre block text-texte-2">
            {THEMES.length} thèmes{enCours > 0 ? ` · ${enCours} en cours` : ''}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-texte-3" strokeWidth={2.4} aria-hidden />
      </button>
    </section>
  )
}
