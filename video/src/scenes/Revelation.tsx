import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COULEURS, TEXTES } from "../config";
import { Fond, Logo, entree, useRessort, useSortie } from "../commun";

export const Revelation: React.FC = () => {
  const frame = useCurrentFrame();
  const sortie = useSortie();
  const logo = useRessort(4, { damping: 11, stiffness: 120 });
  const nom = useRessort(20);
  const promesse = useRessort(36);
  const onde = interpolate(frame, [4, 50], [0, 1], { extrapolateRight: "clamp" });
  const flottement = Math.sin(frame / 14) * 8;

  return (
    <Fond>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", opacity: sortie }}
      >
        <div style={{ position: "relative", marginBottom: 80 }}>
          {[0, 0.35].map((decalage) => {
            const o = Math.max(0, onde - decalage);
            return (
              <div
                key={decalage}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `3px solid ${COULEURS.accent}`,
                  opacity: (1 - o) * 0.5 * (o > 0 ? 1 : 0),
                  transform: `scale(${1 + o * 1.4})`,
                }}
              />
            );
          })}
          <Logo
            taille={380}
            style={{
              transform: `scale(${logo}) rotate(${(1 - logo) * -20}deg) translateY(${flottement}px)`,
            }}
          />
        </div>

        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -6,
            ...entree(nom, 60),
          }}
        >
          {TEXTES.nom}
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 52,
            fontWeight: 500,
            color: COULEURS.texte2,
            textAlign: "center",
            width: 860,
            letterSpacing: -1,
            ...entree(promesse),
          }}
        >
          {TEXTES.revelation.promesse}
        </div>
      </AbsoluteFill>
    </Fond>
  );
};
