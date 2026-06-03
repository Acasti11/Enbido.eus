import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './i18n/config'
import './styles/index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx'
import { ChatWebSocketProvider } from './context/ChatWebSocketContext.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="loading-fallback" />}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <SettingsProvider>
          <ChatWebSocketProvider>
            <App />
          </ChatWebSocketProvider>
        </SettingsProvider>
      </GoogleOAuthProvider>
    </Suspense>
  </StrictMode>,
)