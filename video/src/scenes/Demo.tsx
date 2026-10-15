import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  ArrowUp,
  Check,
  Flame,
  Headphones,
  Mic,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { COULEURS, TEXTES } from "../config";
import { Fond, entree, useRessort, useSortie } from "../commun";

const T = TEXTES.demo;

// Repères dans le temps (en images, à 30 i/s).
const DEBUT_FRAPPE = 24;
const VITESSE_FRAPPE = 0.7; // caractères par image
const FIN_FRAPPE = DEBUT_FRAPPE + Math.ceil(T.demande.length / VITESSE_FRAPPE);
const ENVOI = FIN_FRAPPE + 8;
const REPONSE = ENVOI + 14;
const ETAPES = [REPONSE + 40, REPONSE + 95, REPONSE + 150];
const TABLEAU = ETAPES[2] + 70;

const LEGENDES = [
  { debut: 0, texte: "Pose ta question" },
  { debut: REPONSE, texte: "Apprends étape par étape" },
  { debut: TABLEAU, texte: "Regarde tes progrès monter" },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- Téléphone ---------- */

const Telephone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      position: "relative",
      width: 800,
      height: 1580,
      borderRadius: 120,
      background: "#1C1C1E",
      padding: 18,
      boxShadow:
        "0 60px 120px rgba(0,0,0,0.18), 0 20px 40px rgba(0,0,0,0.10), inset 0 0 0 3px #3A3A3C",
      ...style,
    }}
  >
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 104,
        background: COULEURS.fond,
        overflow: "hidden",
      }}
    >
      {/* Barre d'état et Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 70px",
          fontSize: 32,
          fontWeight: 650,
          zIndex: 5,
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 44, height: 22, borderRadius: 7, border: "3px solid #111", position: "relative" }}>
            <span style={{ position: "absolute", inset: 3, borderRadius: 3, background: "#111" }} />
          </span>
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 26,
          left: "50%",
          width: 230,
          height: 66,
          marginLeft: -115,
          borderRadius: 40,
          background: "#000",
          zIndex: 6,
        }}
      />
      {children}
    </div>
  </div>
);

/* ---------- Écran 1 : question et étapes ---------- */

const Bulle: React.FC<{ frame: number }> = ({ frame }) => {
  const p = useRessort(ENVOI, { damping: 15 });
  if (frame < ENVOI) return null;
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: 560,
        padding: "26px 34px",
        borderRadius: 40,
        borderBottomRightRadius: 12,
        background: COULEURS.accent,
        color: "white",
        fontSize: 36,
        fontWeight: 550,
        ...entree(p, 80),
      }}
    >
      {T.demande}
    </div>
  );
};

const Onde: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 50 }}>
    {Array.from({ length: 22 }).map((_, i) => {
      const h = 12 + Math.abs(Math.sin(frame / 4 + i * 0.7)) * 36 * (0.5 + 0.5 * Math.sin(i));
      return (
        <div
          key={i}
          style={{ width: 7, height: h, borderRadius: 4, background: COULEURS.accent, opacity: 0.85 }}
        />
      );
    })}
  </div>
);

const Reponse: React.FC<{ frame: number }> = ({ frame }) => {
  const p = useRessort(REPONSE);
  if (frame < REPONSE) return null;
  return (
    <div
      style={{
        background: COULEURS.carte,
        borderRadius: 44,
        padding: "34px 38px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        ...entree(p, 60),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: COULEURS.accent, fontSize: 28, fontWeight: 650 }}>
        <Sparkles size={30} />
        En darija, on dit :
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
        <div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1.5 }}>{T.reponseLatin}</div>
          <div style={{ fontSize: 40, color: COULEURS.texte2, marginTop: 6, direction: "rtl", textAlign: "left" }}>
            {T.reponseArabe}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 30, color: COULEURS.texte2, marginTop: 10 }}>{T.reponseFr}</div>
      <div style={{ marginTop: 22 }}>
        <Onde frame={frame} />
      </div>
    </div>
  );
};

const ICONES_ETAPES = [Headphones, Mic, Trophy];

const Etape: React.FC<{ index: number; frame: number }> = ({ index, frame }) => {
  const debut = ETAPES[index];
  const apparition = useRessort(debut - 18);
  const coche = useRessort(debut, { damping: 10, stiffness: 200 });
  const fait = frame >= debut;
  const Icone = ICONES_ETAPES[index];
  const etape = T.etapes[index];
  if (frame < debut - 18) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "26px 30px",
        borderBottom: index < 2 ? `1px solid ${COULEURS.separateur}` : "none",
        ...entree(apparition, 30),
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: COULEURS.accentDoux,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icone size={38} color={COULEURS.accent} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 36, fontWeight: 650, letterSpacing: -0.5 }}>{etape.titre}</div>
        <div style={{ fontSize: 27, color: COULEURS.texte2, marginTop: 4 }}>{etape.detail}</div>
      </div>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: fait ? "none" : `4px solid ${COULEURS.texte3}`,
          background: fait ? COULEURS.vertVif : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${fait ? 0.6 + coche * 0.4 : 1})`,
          boxShadow: fait ? `0 0 0 ${(1 - coche) * 18}px rgba(18,160,106,${0.3 * (1 - coche)})` : "none",
        }}
      >
        {fait ? <Check size={36} color="white" strokeWidth={3.5} /> : null}
      </div>
    </div>
  );
};

const Champ: React.FC<{ frame: number }> = ({ frame }) => {
  const nb = Math.max(0, Math.floor((frame - DEBUT_FRAPPE) * VITESSE_FRAPPE));
  const texte = frame < ENVOI ? T.demande.slice(0, nb) : "";
  const curseur = Math.floor(frame / 8) % 2 === 0;
  const pret = frame >= FIN_FRAPPE && frame < ENVOI;
  const appui = frame >= ENVOI - 4 && frame < ENVOI + 2 ? 0.88 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 34,
        right: 34,
        bottom: 54,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 16px 16px 36px",
        borderRadius: 60,
        background: "rgba(255,255,255,0.85)",
        border: `1px solid ${COULEURS.separateur}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ flex: 1, fontSize: 34, fontWeight: 500, color: texte ? COULEURS.texte : COULEURS.texte3 }}>
        {texte || (frame < DEBUT_FRAPPE ? "Demande une expression…" : "")}
        {frame >= DEBUT_FRAPPE && frame < ENVOI && curseur ? (
          <span style={{ color: COULEURS.accent, fontWeight: 300 }}>|</span>
        ) : null}
      </div>
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          background: pret || texte ? COULEURS.accent : COULEURS.texte3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${appui})`,
        }}
      >
        <ArrowUp size={40} color="white" strokeWidth={3} />
      </div>
    </div>
  );
};

const EcranSession: React.FC<{ frame: number }> = ({ frame }) => {
  const progression = interpolate(frame, [REPONSE, ETAPES[2]], [0.05, 1], clamp);
  return (
    <AbsoluteFill style={{ padding: "140px 34px 0" }}>
      <div style={{ padding: "0 14px" }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: COULEURS.texte2 }}>Apprendre</div>
        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: -2, marginTop: 4 }}>{T.titreApp}</div>
        <div style={{ height: 16, borderRadius: 8, background: "rgba(118,118,128,0.14)", marginTop: 22, overflow: "hidden" }}>
          <div
            style={{
              width: `${progression * 100}%`,
              height: "100%",
              borderRadius: 8,
              background: `linear-gradient(90deg, ${COULEURS.accent}, ${COULEURS.accentClair})`,
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 40 }}>
        <Bulle frame={frame} />
        <Reponse frame={frame} />
        {frame >= ETAPES[0] - 18 ? (
          <div style={{ background: COULEURS.carte, borderRadius: 44, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
            {[0, 1, 2].map((i) => (
              <Etape key={i} index={i} frame={frame} />
            ))}
          </div>
        ) : null}
      </div>
      <Champ frame={frame} />
    </AbsoluteFill>
  );
};

/* ---------- Écran 2 : tableau de bord ---------- */

const ICONES_KPI = [Flame, Star, Trophy];
const COULEURS_KPI = [COULEURS.accent, COULEURS.energie, COULEURS.vert];

const Indicateur: React.FC<{ index: number; frame: number }> = ({ index, frame }) => {
  const debut = TABLEAU + 10 + index * 8;
  const p = useRessort(debut);
  const k = T.indicateurs[index];
  const valeur = Math.round(
    interpolate(frame, [debut, debut + 55], [0, k.valeur], {
      ...clamp,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    }),
  );
  const Icone = ICONES_KPI[index];
  const large = index === 0;
  return (
    <div
      style={{
        gridColumn: large ? "span 2" : undefined,
        background: COULEURS.carte,
        borderRadius: 40,
        padding: "30px 34px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 24,
        ...entree(p, 50),
      }}
    >
      <div
        style={{
          width: large ? 100 : 72,
          height: large ? 100 : 72,
          borderRadius: large ? 30 : 22,
          background: `${COULEURS_KPI[index]}1F`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icone size={large ? 56 : 40} color={COULEURS_KPI[index]} fill={index < 2 ? COULEURS_KPI[index] : "none"} strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 600, color: COULEURS.texte2 }}>{k.label}</div>
        <div style={{ fontSize: large ? 76 : 54, fontWeight: 800, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>
          {valeur.toLocaleString("fr-FR")}
          <span style={{ fontSize: large ? 38 : 28, fontWeight: 650, color: COULEURS.texte2 }}>{k.suffixe}</span>
        </div>
      </div>
    </div>
  );
};

const Jauge: React.FC<{ index: number; frame: number }> = ({ index, frame }) => {
  const debut = TABLEAU + 40 + index * 10;
  const j = T.jauges[index];
  const v = interpolate(frame, [debut, debut + 45], [0, j.pourcentage], {
    ...clamp,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <div style={{ padding: "22px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: 600, marginBottom: 14 }}>
        <span>{j.label}</span>
        <span style={{ color: COULEURS.vert, fontVariantNumeric: "tabular-nums" }}>{Math.round(v)} %</span>
      </div>
      <div style={{ height: 18, borderRadius: 9, background: "rgba(118,118,128,0.14)", overflow: "hidden" }}>
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            borderRadius: 9,
            background: `linear-gradient(90deg, ${COULEURS.vert}, ${COULEURS.vertVif})`,
          }}
        />
      </div>
    </div>
  );
};

const Semaine: React.FC<{ frame: number }> = ({ frame }) => {
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  const hauteurs = [40, 62, 48, 80, 70, 96, 110];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 170, padding: "0 6px" }}>
      {jours.map((j, i) => {
        const debut = TABLEAU + 30 + i * 4;
        const h = interpolate(frame, [debut, debut + 30], [0, hauteurs[i]], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 54,
                height: h,
                borderRadius: 14,
                background: i === 6 ? COULEURS.accent : COULEURS.energie,
                opacity: i === 6 ? 1 : 0.8,
              }}
            />
            <span style={{ fontSize: 24, fontWeight: 600, color: COULEURS.texte2 }}>{j}</span>
          </div>
        );
      })}
    </div>
  );
};

const EcranTableau: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ padding: "140px 34px 0" }}>
    <div style={{ padding: "0 14px" }}>
      <div style={{ fontSize: 30, fontWeight: 600, color: COULEURS.texte2 }}>Progrès</div>
      <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: -2, marginTop: 4 }}>{T.titreTableau}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 34 }}>
      {[0, 1, 2].map((i) => (
        <Indicateur key={i} index={i} frame={frame} />
      ))}
    </div>
    <div style={{ background: COULEURS.carte, borderRadius: 40, padding: "28px 34px", marginTop: 22, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 28, fontWeight: 650, color: COULEURS.texte2, marginBottom: 18 }}>XP de la semaine</div>
      <Semaine frame={frame} />
    </div>
    <div style={{ background: COULEURS.carte, borderRadius: 40, padding: "10px 34px", marginTop: 22, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
      {[0, 1, 2].map((i) => (
        <Jauge key={i} index={i} frame={frame} />
      ))}
    </div>
  </AbsoluteFill>
);

/* ---------- Scène ---------- */

const Legende: React.FC<{ frame: number }> = ({ frame }) => {
  const actuelle = [...LEGENDES].reverse().find((l) => frame >= l.debut) ?? LEGENDES[0];
  const p = useRessort(actuelle.debut);
  return (
    <div
      key={actuelle.texte}
      style={{
        position: "absolute",
        top: 92,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 58,
        fontWeight: 800,
        letterSpacing: -2,
        ...entree(p, 30),
      }}
    >
      {actuelle.texte}
    </div>
  );
};

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const sortie = useSortie();
  const tel = useRessort(0, { damping: 16, stiffness: 110 });
  // Glissement de l'écran de session vers le tableau de bord.
  const bascule = useRessort(TABLEAU, { damping: 20, stiffness: 120 });

  return (
    <Fond>
      <AbsoluteFill style={{ opacity: sortie }}>
        <Legende frame={frame} />
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 230,
            transform: `translateY(${(1 - tel) * 900}px) scale(${0.92 + tel * 0.08})`,
          }}
        >
          <Telephone>
            <AbsoluteFill style={{ transform: `translateX(${-bascule * 100}%)`, opacity: 1 - bascule * 0.6 }}>
              <EcranSession frame={frame} />
            </AbsoluteFill>
            <AbsoluteFill style={{ transform: `translateX(${(1 - bascule) * 100}%)` }}>
              {frame >= TABLEAU - 5 ? <EcranTableau frame={frame} /> : null}
            </AbsoluteFill>
          </Telephone>
        </div>
      </AbsoluteFill>
    </Fond>
  );
};
