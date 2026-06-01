import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/config'
import './styles/index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="loading-fallback" />}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </Suspense>
  </StrictMode>,
)