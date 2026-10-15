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

/** Carte d'un thème : icône, titre, mots vus sur le total et jauge. */
function CarteTheme({ id, vus, total, onClick }: { id: string; vus: number; total: number; onClick: () => void }) {
  const theme = THEMES.find((t) => t.id === id)!
  const { icone: Icone, couleur } = VISUELS_THEMES[id]
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex w-[136px] shrink-0 snap-start flex-col rounded-[22px] bg-carte p-3 text-left"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] text-white" style={{ background: couleur }} aria-hidden>
        <Icone className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="t-appel mt-2 line-clamp-2 min-h-[2.5em] font-semibold leading-tight">{theme.titre}</span>
      <span className="t-note mt-1 tabular-nums text-texte-2">
        {vus > 0 ? `${vus}/${total} vus` : `${total} mots`}
      </span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-remplissage" aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${(vus / total) * 100}%`, background: couleur }} />
      </span>
    </button>
  )
}

/** Les thèmes en carrousel horizontal : ceux en cours d'abord, « Tout voir » pour la liste complète. */
export function CarrouselThemes({ onTheme, onTout }: { onTheme: (id: string) => void; onTout: () => void }) {
  const { motsVus } = useResume()
  const themes = ordonnerThemes(MOTS_DES_THEMES, motsVus)
  return (
    <section className="mb-[26px]">
      <TitreBloc titre="Thèmes" lien={{ libelle: `Tout voir (${THEMES.length})`, action: onTout }} />
      {/* Déborde jusqu'aux bords de l'écran, sans barre de défilement. */}
      <div
        data-sans-balayage
        className="-mx-marge flex snap-x snap-mandatory scroll-px-marge gap-2.5 overflow-x-auto px-marge pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {themes.map((t) => (
          <CarteTheme key={t.id} id={t.id} vus={t.vus} total={t.total} onClick={() => onTheme(t.id)} />
        ))}
      </div>
    </section>
  )
}
