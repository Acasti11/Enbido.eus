import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useChatWebSocket } from './ChatWebSocketContext';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import api from '@/shared/lib/api';

export interface ChatMessage {
  senderId: number;
  senderName: string;
  content: string;
  timestamp: number;
}

export interface ChatUser {
  id: number;
  username: string;
  status?: 'online' | 'offline';
  isBot?: boolean;
}

interface ChatContextType {
  activeChatUser: ChatUser | null;
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatOpen: boolean;
  isInGame: boolean;
  openChat: (user: ChatUser) => void;
  closeChat: () => void;
  setChatInput: (value: string) => void;
  sendMessage: (content: string) => void;
  loadMessages: (userId: number, username: string, isBot?: boolean) => Promise<void>;
  setIsInGame: (value: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInGame, setIsInGame] = useState(false);
  
  const { user } = useAuth();
  const currentUserId = user?.userId || 0;
  const activeUsername = user?.username || 'User';
  
  const {
    registerDmCallback,
    unregisterDmCallback,
    sendDirectMessage
  } = useChatWebSocket();

  const openChat = useCallback((user: ChatUser) => {
    if (isInGame) return; // Block opening chat during game
    setActiveChatUser(user);
    setIsChatOpen(true);
  }, [isInGame]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveChatUser(null);
    setChatMessages([]);
    setChatInput('');
  }, []);

  const loadMessages = useCallback(async (userId: number, username: string, isBot?: boolean) => {
    if (isBot) {
      const key = `enbido_chat_with_${currentUserId}_and_${userId}`;
      const savedMsgs = localStorage.getItem(key);
      let parsedMsgs: ChatMessage[] = [];
      if (savedMsgs) {
        try {
          const parsed = JSON.parse(savedMsgs);
          parsedMsgs = Array.isArray(parsed) ? parsed : [];
        } catch {
          parsedMsgs = [];
        }
      }
      setChatMessages(parsedMsgs);
    } else {
      try {
        const res = await api.get(`/messages/${userId}`);
        const dataArray = Array.isArray(res.data) ? res.data : [];
        const mapped = dataArray.map((m: { senderId: number; content: string; sentAt: string }) => ({
          senderId: m.senderId,
          senderName: m.senderId === currentUserId ? activeUsername : username,
          content: m.content,
          timestamp: new Date(m.sentAt).getTime()
        }));
        setChatMessages(mapped);
      } catch (err) {
        console.error('Error loading chat messages from DB:', err);
        setChatMessages([]);
      }
    }
  }, [currentUserId, activeUsername]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !activeChatUser) return;

    const msgText = content.trim();

    if (activeChatUser.isBot) {
      const myMsg: ChatMessage = {
        senderId: currentUserId,
        senderName: activeUsername,
        content: msgText,
        timestamp: Date.now()
      };

      const updatedMsgs = [...chatMessages, myMsg];
      setChatMessages(updatedMsgs);

      const key = `enbido_chat_with_${currentUserId}_and_${activeChatUser.id}`;
      localStorage.setItem(key, JSON.stringify(updatedMsgs));

      // Bot response after 1.5s
      setTimeout(() => {
        let botResponseContent = '';
        if (activeChatUser.id === -1) {
          const replies = [
            '¡Hola! ¿Quieres jugar una partida?',
            '¿Cómo te va el día?',
            '¡Vamos a ganar!',
            '¿Conoces algún truco del Mus?',
            '¡Suerte en tu próxima partida!'
          ];
          botResponseContent = replies[Math.floor(Math.random() * replies.length)];
        } else {
          botResponseContent = 'Interesante... cuéntame más.';
        }

        const botMsg: ChatMessage = {
          senderId: activeChatUser.id,
          senderName: activeChatUser.username,
          content: botResponseContent,
          timestamp: Date.now()
        };

        const updatedWithBot = [...updatedMsgs, botMsg];
        setChatMessages(updatedWithBot);
        localStorage.setItem(key, JSON.stringify(updatedWithBot));
      }, 1500);
    } else {
      // Real message via WebSocket
      sendDirectMessage(activeChatUser.id, msgText);
      
      // Optimistically add to UI
      const myMsg: ChatMessage = {
        senderId: currentUserId,
        senderName: activeUsername,
        content: msgText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, myMsg]);
    }
  }, [activeChatUser, currentUserId, activeUsername, chatMessages, sendDirectMessage]);

  // WebSocket callback for incoming messages
  useEffect(() => {
    if (!activeChatUser || activeChatUser.isBot) {
      unregisterDmCallback();
      return;
    }

    localStorage.setItem('enbido_active_chat_user_id', String(activeChatUser.id));

    registerDmCallback((newMsg: { senderId: number; receiverId: number; content: string; sentAt: string; sender?: { username: string } }) => {
      if (
        (newMsg.senderId === currentUserId && newMsg.receiverId === activeChatUser.id) ||
        (newMsg.senderId === activeChatUser.id && newMsg.receiverId === currentUserId)
      ) {
        setChatMessages(prev => {
          const exists = prev.some(m => m.timestamp === new Date(newMsg.sentAt).getTime() && m.content === newMsg.content);
          if (exists) return prev;
          return [...prev, {
            senderId: newMsg.senderId,
            senderName: newMsg.sender?.username || (newMsg.senderId === currentUserId ? activeUsername : activeChatUser.username),
            content: newMsg.content,
            timestamp: new Date(newMsg.sentAt).getTime()
          }];
        });
      }
    });

    return () => {
      unregisterDmCallback();
      localStorage.removeItem('enbido_active_chat_user_id');
    };
  }, [activeChatUser, currentUserId, activeUsername, registerDmCallback, unregisterDmCallback]);

  // Load messages when chat opens
  useEffect(() => {
    if (activeChatUser && isChatOpen) {
      loadMessages(activeChatUser.id, activeChatUser.username, activeChatUser.isBot);
    }
  }, [activeChatUser, isChatOpen, loadMessages]);

  // Listen for external chat open events (from notifications)
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      if (isInGame) return; // Don't open chat during game
      const customEvent = event as CustomEvent;
      const { friendId, username } = customEvent.detail;
      if (friendId && username) {
        openChat({
          id: friendId,
          username: username,
          status: 'online'
        });
      }
    };

    window.addEventListener('enbido_open_chat', handleOpenChat);
    return () => {
      window.removeEventListener('enbido_open_chat', handleOpenChat);
    };
  }, [openChat]);

  return (
    <ChatContext.Provider
      value={{
        activeChatUser,
        chatMessages,
        chatInput,
        isChatOpen,
        isInGame,
        openChat,
        closeChat,
        setChatInput,
        sendMessage,
        loadMessages,
        setIsInGame
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
