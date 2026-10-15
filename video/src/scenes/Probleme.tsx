import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BookX, ListOrdered, MicOff } from "lucide-react";
import { COULEURS, TEXTES } from "../config";
import { Fond, entree, useRessort, useSortie } from "../commun";

const ICONES = [ListOrdered, BookX, MicOff];
const DEBUT_SATURATION = 92;

const Tache: React.FC<{ index: number; texte: string }> = ({ index, texte }) => {
  const frame = useCurrentFrame();
  const p = useRessort(14 + index * 18, { damping: 13, stiffness: 160 });
  const Icone = ICONES[index % ICONES.length];
  // Les cartes s'empilent puis tremblent quand tout sature.
  const tremble =
    frame > DEBUT_SATURATION
      ? Math.sin(frame * 2.3 + index) *
        interpolate(frame, [DEBUT_SATURATION, DEBUT_SATURATION + 30], [0, 7], {
          extrapolateRight: "clamp",
        })
      : 0;
  const rouge = interpolate(frame, [DEBUT_SATURATION, DEBUT_SATURATION + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotation = [-3, 2.5, -1.5][index] ?? 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        width: 860,
        padding: "40px 44px",
        marginTop: index === 0 ? 0 : -18,
        borderRadius: 40,
        background: COULEURS.carte,
        border: `2px solid ${rouge > 0 ? `rgba(217, 58, 74, ${0.5 * rouge})` : COULEURS.separateur}`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.08), 0 0 0 ${rouge * 6}px rgba(217,58,74,${0.08 * rouge})`,
        opacity: p,
        transform: `translate(${tremble}px, ${(1 - p) * -500}px) rotate(${rotation * p}deg)`,
        zIndex: 10 - index,
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 26,
          background: COULEURS.accentDoux,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icone size={50} color={COULEURS.accent} strokeWidth={2.2} />
      </div>
      <div style={{ fontSize: 44, fontWeight: 650, letterSpacing: -1, lineHeight: 1.2 }}>
        {texte}
      </div>
    </div>
  );
};

export const Probleme: React.FC = () => {
  const frame = useCurrentFrame();
  const sortie = useSortie();
  const titre = useRessort(0);
  const fin = useRessort(DEBUT_SATURATION + 20);
  const charge = interpolate(frame, [20, DEBUT_SATURATION + 20], [8, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const couleurCharge = charge > 80 ? COULEURS.rouge : COULEURS.energie;

  return (
    <Fond halo="rgba(217, 58, 74, 0.08)">
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", opacity: sortie }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: -3,
            textAlign: "center",
            lineHeight: 1.08,
            width: 900,
            marginBottom: 90,
            ...entree(titre),
          }}
        >
          {TEXTES.probleme.titre}
        </div>

        {TEXTES.probleme.taches.map((t, i) => (
          <Tache key={t} index={i} texte={t} />
        ))}

        {/* Jauge de saturation */}
        <div style={{ width: 860, marginTop: 90, ...entree(titre) }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 30,
              fontWeight: 600,
              color: COULEURS.texte2,
              marginBottom: 16,
            }}
          >
            <span>Charge mentale</span>
            <span style={{ color: couleurCharge }}>{Math.round(charge)} %</span>
          </div>
          <div
            style={{
              height: 22,
              borderRadius: 11,
              background: "rgba(118,118,128,0.14)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${charge}%`,
                height: "100%",
                borderRadius: 11,
                background: couleurCharge,
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 80,
            fontSize: 54,
            fontWeight: 700,
            color: COULEURS.rouge,
            letterSpacing: -1.5,
            ...entree(fin),
          }}
        >
          {TEXTES.probleme.conclusion}
        </div>
      </AbsoluteFill>
    </Fond>
  );
};
