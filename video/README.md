# Vidéo de présentation de Darijaapp

Remotion, 1080x1920, 30 images/s, 45 s. Six scènes (`src/scenes/`), assemblées par `<Series>` dans `src/Principale.tsx`.

- Textes, couleurs et durées : `src/config.ts`.
- Logo : `public/logo.png` (copie de `public/pot-512.png` de l'appli) ; police Inter : `public/polices/`.

```bash
npm i
npm run dev                                   # Remotion Studio (http://localhost:3000)
npx remotion render Darijaapp out/darijaapp.mp4   # rendu MP4
```

Chaque scène est aussi une composition à part (dossier « Scenes » du Studio).
