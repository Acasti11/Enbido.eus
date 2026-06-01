import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/config'
import './styles/index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx'
import { ChatWebSocketProvider } from './context/ChatWebSocketContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="loading-fallback" />}>
      <SettingsProvider>
        <ChatWebSocketProvider>
          <App />
        </ChatWebSocketProvider>
      </SettingsProvider>
    </Suspense>
  </StrictMode>,
)