/// <reference types="vitest/config" />
import { existsSync, readdirSync, statSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// MP3 présents dans public/audio : l'appli ne tente de les lire que s'ils existent,
// sinon elle passe directement à la synthèse vocale du téléphone.
const dossierAudio = 'public/audio'
const audios = existsSync(dossierAudio)
  ? readdirSync(dossierAudio).filter((f) => f.endsWith('.mp3')).sort()
  : []
// Poids total des MP3, annoncé avant de tout télécharger pour le hors-ligne (Profil).
const tailleAudio = audios.reduce((t, f) => t + statSync(`${dossierAudio}/${f}`).size, 0)

export default defineConfig({
  base: '/Darijapp/',
  define: {
    __AUDIOS__: JSON.stringify(audios),
    __TAILLE_AUDIO__: JSON.stringify(tailleAudio),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pot-180.png', 'pot-favicon.png'],
      workbox: {
        // Les MP3 (plusieurs dizaines de Mo) ne sont pas téléchargés à l'installation : chacun est gardé
        // sur le téléphone à sa première écoute, ou tous d'un coup depuis Profil (src/audio/horsLigne.ts),
        // dans le même cache « audio ».
        // La vidéo d'ouverture (lancement.mp4, 0,6 Mo) et son image finale sont gardées dès l'installation.
        globPatterns: ['**/*.{js,css,html,png,svg,jpg,mp4}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              // Safari lit l'audio par morceaux (requêtes Range) : sans cela, le MP3 en cache ne joue pas.
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              // Au-dessus du nombre de MP3 (3 511 en octobre 2026) : sinon les plus anciens seraient effacés.
              expiration: { maxEntries: 10000 },
            },
          },
        ],
      },
      manifest: {
        name: 'Darijaapp',
        short_name: 'Darijaapp',
        description: 'Apprendre le darija marocain à l\'oral',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf9f5',
        theme_color: '#c93a26',
        icons: [
          { src: 'pot-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pot-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pot-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
