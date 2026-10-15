import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Gamepad2, GraduationCap, Sparkles } from "lucide-react";
import { COULEURS, TEXTES } from "../config";
import { Fond, entree, useRessort, useSortie } from "../commun";

const ICONES = [Sparkles, Gamepad2, GraduationCap];
const TEINTES = [COULEURS.accent, COULEURS.energie, COULEURS.vert];
const DEBUT_CHIFFRE = 110;

const Carte: React.FC<{ index: number }> = ({ index }) => {
  const p = useRessort(14 + index * 12, { damping: 15, stiffness: 150 });
  const carte = TEXTES.benefices.cartes[index];
  const Icone = ICONES[index];
  const teinte = TEINTES[index];
  const cote = index % 2 === 0 ? -1 : 1;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 34,
        width: 900,
        padding: "40px 44px",
        borderRadius: 44,
        background: COULEURS.carte,
        border: `1px solid ${COULEURS.separateur}`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.07)",
        opacity: p,
        transform: `translateX(${(1 - p) * cote * 400}px) rotate(${(1 - p) * cote * 6}deg)`,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 34,
          background: `linear-gradient(145deg, ${teinte}, ${teinte}CC)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 12px 28px ${teinte}55`,
        }}
      >
        <Icone size={62} color="white" strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1.5 }}>{carte.titre}</div>
        <div style={{ fontSize: 34, fontWeight: 500, color: COULEURS.texte2, marginTop: 6 }}>{carte.texte}</div>
      </div>
    </div>
  );
};

export const Benefices: React.FC = () => {
  const frame = useCurrentFrame();
  const sortie = useSortie();
  const titre = useRessort(0);
  const chiffre = useRessort(DEBUT_CHIFFRE, { damping: 12 });
  const valeur = Math.round(
    interpolate(frame, [DEBUT_CHIFFRE, DEBUT_CHIFFRE + 50], [0, TEXTES.benefices.chiffre], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 3),
    }),
  );

  return (
    <Fond>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, opacity: sortie }}>
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3, marginBottom: 70, ...entree(titre) }}>
          {TEXTES.benefices.titre}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          {[0, 1, 2].map((i) => (
            <Carte key={i} index={i} />
          ))}
        </div>
        <div style={{ marginTop: 100, textAlign: "center", ...entree(chiffre, 60) }}>
          <div
            style={{
              fontSize: 220,
              fontWeight: 800,
              letterSpacing: -10,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              background: `linear-gradient(135deg, ${COULEURS.accent}, ${COULEURS.energie})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              transform: `scale(${0.8 + chiffre * 0.2})`,
            }}
          >
            {valeur.toLocaleString("fr-FR")}
          </div>
          <div style={{ fontSize: 42, fontWeight: 600, color: COULEURS.texte2, marginTop: 14 }}>
            {TEXTES.benefices.chiffreLabel}
          </div>
        </div>
      </AbsoluteFill>
    </Fond>
  );
};
