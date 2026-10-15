import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { COULEURS, POLICE } from "./config";

// Inter variable (licence OFL), embarquée pour que le rendu marche hors ligne.
loadFont({
  family: POLICE,
  url: staticFile("polices/inter.woff2"),
  weight: "100 900",
});

export const police = `"${POLICE}", -apple-system, "Helvetica Neue", sans-serif`;

/** Ressort qui démarre après `delai` images. */
export const useRessort = (
  delai = 0,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delai,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.8, ...config },
  });
};

/** Apparition : monte de 40 px et s'éclaircit. */
export const entree = (p: number, distance = 40): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * distance}px)`,
});

/** Sortie rapide sur les `duree` dernières images de la scène. */
export const useSortie = (duree = 8) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(
    frame,
    [durationInFrames - duree, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};

/** Fond clair façon SaaS premium : grille fine et halo corail. */
export const Fond: React.FC<{ children: React.ReactNode; halo?: string }> = ({
  children,
  halo = COULEURS.accentDoux,
}) => {
  const frame = useCurrentFrame();
  const derive = Math.sin(frame / 40) * 30;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COULEURS.fond,
        fontFamily: police,
        color: COULEURS.texte,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COULEURS.separateur} 1px, transparent 1px), linear-gradient(90deg, ${COULEURS.separateur} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          opacity: 0.45,
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 75%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          left: -10 + derive,
          top: 300 - derive,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${halo} 0%, transparent 65%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/** Logo de l'appli (icône de l'écran d'accueil), en carré arrondi façon iOS. */
export const Logo: React.FC<{ taille: number; style?: React.CSSProperties }> = ({
  taille,
  style,
}) => (
  <Img
    src={staticFile("logo.png")}
    style={{
      width: taille,
      height: taille,
      borderRadius: taille * 0.225,
      boxShadow: `0 ${taille * 0.08}px ${taille * 0.25}px rgba(201, 58, 38, 0.28), 0 2px 6px rgba(0,0,0,0.08)`,
      ...style,
    }}
  />
);

/** Petite étiquette en haut des scènes. */
export const Etiquette: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 28px",
      borderRadius: 999,
      background: COULEURS.carte,
      border: `1px solid ${COULEURS.separateur}`,
      fontSize: 30,
      fontWeight: 600,
      color: COULEURS.accent,
      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);
