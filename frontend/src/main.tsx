import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx'
import { ChatWebSocketProvider } from './context/ChatWebSocketContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <ChatWebSocketProvider>
        <App />
      </ChatWebSocketProvider>
    </SettingsProvider>
  </StrictMode>,
)