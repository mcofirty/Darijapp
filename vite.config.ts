/// <reference types="vitest/config" />
import { existsSync, readdirSync } from 'node:fs'
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

export default defineConfig({
  base: '/Darijapp/',
  define: {
    __AUDIOS__: JSON.stringify(audios),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-180.png', 'logo-favicon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,mp3}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Darijaapp',
        short_name: 'Darijaapp',
        description: 'Apprendre le darija marocain à l\'oral',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf9f5',
        theme_color: '#c1272d',
        icons: [
          { src: 'logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'logo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
