import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COULEURS, TEXTES } from "../config";
import { Fond, entree, useRessort, useSortie } from "../commun";

const Mot: React.FC<{ mot: string; delai: number }> = ({ mot, delai }) => {
  const p = useRessort(delai, { damping: 14, stiffness: 180 });
  const accent = mot.toLowerCase().includes("darija");
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: 22,
        color: accent ? COULEURS.accent : COULEURS.texte,
        opacity: p,
        transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + p * 0.1})`,
        filter: `blur(${(1 - p) * 8}px)`,
      }}
    >
      {mot}
    </span>
  );
};

export const Accroche: React.FC = () => {
  const frame = useCurrentFrame();
  const sortie = useSortie();
  const mots = TEXTES.accroche.question.split(" ");
  const sous = useRessort(14 + mots.length * 4);
  // Léger zoom continu pour garder du mouvement.
  const zoom = 1 + frame * 0.0008;

  return (
    <Fond>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 90,
          opacity: sortie,
          transform: `scale(${zoom})`,
        }}
      >
        <div
          style={{
            fontSize: 112,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1.08,
            textAlign: "center",
          }}
        >
          {mots.map((mot, i) => (
            <Mot key={i} mot={mot} delai={6 + i * 4} />
          ))}
        </div>
        <div
          style={{
            marginTop: 56,
            fontSize: 44,
            fontWeight: 500,
            color: COULEURS.texte2,
            ...entree(sous),
          }}
        >
          {TEXTES.accroche.sousTitre}
        </div>
      </AbsoluteFill>
    </Fond>
  );
};
