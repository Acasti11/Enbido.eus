import React from 'react';
import { AuthProvider } from '@/features/auth/hooks/AuthContext';
import { SettingsProvider } from '@/shared/hooks/SettingsContext';
import { ChatProvider } from '@/features/chat/hooks/ChatContext';
import { ChatWebSocketProvider } from '@/features/chat/hooks/ChatWebSocketContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ChatProvider>
          <ChatWebSocketProvider>
            {children}
          </ChatWebSocketProvider>
        </ChatProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};
