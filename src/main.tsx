import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App.tsx'
import './index.css'

registerSW({ immediate: true })

// Reflet du verre interactif : il suit le point de contact.
document.addEventListener(
  'pointerdown',
  (e) => {
    const cible = (e.target as Element).closest<HTMLElement>('.verre-interactif')
    if (!cible) return
    const r = cible.getBoundingClientRect()
    cible.style.setProperty('--x', `${e.clientX - r.left}px`)
    cible.style.setProperty('--y', `${e.clientY - r.top}px`)
  },
  { passive: true },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
