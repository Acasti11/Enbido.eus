import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './i18n/config'
import '@/shared/styles/index.css'
import App from './App.tsx'
import { AuthProvider } from '@/features/auth/hooks/AuthContext.tsx'
import { SettingsProvider } from '@/context/SettingsContext.tsx'
import { ChatWebSocketProvider } from '@/features/chat/hooks/ChatWebSocketContext.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="loading-fallback" />}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <SettingsProvider>
            <ChatWebSocketProvider>
              <App />
            </ChatWebSocketProvider>
          </SettingsProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Suspense>
  </StrictMode>,
)