import React from "react";
import { Series } from "remotion";
import { DUREES, FORMAT } from "./config";
import { Accroche } from "./scenes/Accroche";
import { Probleme } from "./scenes/Probleme";
import { Revelation } from "./scenes/Revelation";
import { Demo } from "./scenes/Demo";
import { Benefices } from "./scenes/Benefices";
import { Appel } from "./scenes/Appel";

export const SCENES = [
  { id: "Accroche", composant: Accroche, duree: DUREES.accroche },
  { id: "Probleme", composant: Probleme, duree: DUREES.probleme },
  { id: "Revelation", composant: Revelation, duree: DUREES.revelation },
  { id: "Demo", composant: Demo, duree: DUREES.demo },
  { id: "Benefices", composant: Benefices, duree: DUREES.benefices },
  { id: "Appel", composant: Appel, duree: DUREES.appel },
] as const;

export const images = (secondes: number) => Math.round(secondes * FORMAT.fps);

export const DUREE_TOTALE = SCENES.reduce((t, s) => t + images(s.duree), 0);

export const Principale: React.FC = () => (
  <Series>
    {SCENES.map(({ id, composant: Scene, duree }) => (
      <Series.Sequence key={id} name={id} durationInFrames={images(duree)}>
        <Scene />
      </Series.Sequence>
    ))}
  </Series>
);
