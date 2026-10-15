import React from "react";
import { Composition, Folder } from "remotion";
import { FORMAT } from "./config";
import { DUREE_TOTALE, Principale, SCENES, images } from "./Principale";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Darijaapp"
      component={Principale}
      durationInFrames={DUREE_TOTALE}
      fps={FORMAT.fps}
      width={FORMAT.largeur}
      height={FORMAT.hauteur}
    />
    <Folder name="Scenes">
      {SCENES.map(({ id, composant, duree }) => (
        <Composition
          key={id}
          id={id}
          component={composant}
          durationInFrames={images(duree)}
          fps={FORMAT.fps}
          width={FORMAT.largeur}
          height={FORMAT.hauteur}
        />
      ))}
    </Folder>
  </>
);
