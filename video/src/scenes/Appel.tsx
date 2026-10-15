import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ArrowRight } from "lucide-react";
import { COULEURS, TEXTES } from "../config";
import { Fond, Logo, entree, useRessort } from "../commun";

export const Appel: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = useRessort(0, { damping: 12, stiffness: 130 });
  const phrase = useRessort(10);
  const sous = useRessort(18);
  const bouton = useRessort(26, { damping: 12 });
  const url = useRessort(34);
  // Pulsation douce du bouton pour inviter au geste.
  const pulse = 1 + Math.max(0, Math.sin((frame - 40) / 7)) * 0.03 * (frame > 40 ? 1 : 0);
  const reflet = ((frame * 14) % 1600) - 400;

  return (
    <Fond>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
        <Logo taille={300} style={{ transform: `scale(${logo})` }} />
        <div style={{ fontSize: 48, fontWeight: 700, color: COULEURS.texte2, marginTop: 50, ...entree(logo) }}>
          {TEXTES.nom}
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1.05,
            textAlign: "center",
            marginTop: 30,
            ...entree(phrase, 60),
          }}
        >
          {TEXTES.appel.phrase}
        </div>
        <div style={{ fontSize: 42, fontWeight: 500, color: COULEURS.texte2, marginTop: 30, ...entree(sous) }}>
          {TEXTES.appel.sousPhrase}
        </div>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            marginTop: 80,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "38px 70px",
            borderRadius: 999,
            background: COULEURS.accent,
            color: "white",
            fontSize: 46,
            fontWeight: 700,
            boxShadow: "0 24px 60px rgba(201, 58, 38, 0.35)",
            opacity: bouton,
            transform: `scale(${(0.7 + bouton * 0.3) * pulse})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: reflet,
              width: 120,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              transform: "skewX(-20deg)",
            }}
          />
          {TEXTES.appel.bouton}
          <ArrowRight size={46} strokeWidth={2.8} />
        </div>
        <div
          style={{
            marginTop: 50,
            fontSize: 40,
            fontWeight: 600,
            color: COULEURS.accent,
            letterSpacing: -0.5,
            ...entree(url),
          }}
        >
          {TEXTES.appel.url}
        </div>
      </AbsoluteFill>
    </Fond>
  );
};
