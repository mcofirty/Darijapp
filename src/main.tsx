import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App.tsx'
import { demarrerLancement } from './app/lancement'
import { demanderStockagePersistant } from './app/stockage'
import { bloquerZoom } from './app/zoom'
import './index.css'

demarrerLancement()
bloquerZoom()
registerSW({ immediate: true })
void demanderStockagePersistant()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
