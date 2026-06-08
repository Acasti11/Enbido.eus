import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSettings } from './SettingsContext';

interface ChatWebSocketContextType {
  connected: boolean;
  sendDirectMessage: (receiverId: number, content: string) => void;
  sendMeetupMessage: (meetupId: number, content: string) => void;
  joinMeetup: (meetupId: number) => void;
  leaveMeetup: (meetupId: number) => void;
  registerDmCallback: (callback: (msg: any) => void) => void;
  unregisterDmCallback: () => void;
  registerMeetupCallback: (callback: (msg: any) => void) => void;
  unregisterMeetupCallback: () => void;
  registerFriendshipCallback: (callback: (event: any) => void) => void;
  unregisterFriendshipCallback: () => void;
}

const ChatWebSocketContext = createContext<ChatWebSocketContextType | undefined>(undefined);

export const useChatWebSocket = () => {
  const context = useContext(ChatWebSocketContext);
  if (!context) {
    throw new Error('useChatWebSocket must be used within a ChatWebSocketProvider');
  }
  return context;
};

export const ChatWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Callbacks para los componentes activos
  const dmCallbackRef = useRef<((msg: any) => void) | null>(null);
  const meetupCallbackRef = useRef<((msg: any) => void) | null>(null);
  const friendshipCallbackRef = useRef<((event: any) => void) | null>(null);

  // Settings para poder reproducir efectos y notificaciones emergentes en background
  const settingsContext = useSettings();
  const settingsRef = useRef(settingsContext);

  useEffect(() => {
    settingsRef.current = settingsContext;
  }, [settingsContext]);

  const registerDmCallback = useCallback((callback: (msg: any) => void) => {
    dmCallbackRef.current = callback;
  }, []);

  const unregisterDmCallback = useCallback(() => {
    dmCallbackRef.current = null;
  }, []);

  const registerMeetupCallback = useCallback((callback: (msg: any) => void) => {
    meetupCallbackRef.current = callback;
  }, []);

  const unregisterMeetupCallback = useCallback(() => {
    meetupCallbackRef.current = null;
  }, []);

  const registerFriendshipCallback = useCallback((callback: (event: any) => void) => {
    friendshipCallbackRef.current = callback;
  }, []);

  const unregisterFriendshipCallback = useCallback(() => {
    friendshipCallbackRef.current = null;
  }, []);

  // --- MÉTODOS DE ENVÍO Y CONTROL ---

  const sendDirectMessage = useCallback((receiverId: number, content: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SEND_DM',
        receiverId,
        content
      }));
    } else {
      console.warn('Socket no conectado. No se pudo enviar el DM.');
    }
  }, []);

  const sendMeetupMessage = useCallback((meetupId: number, content: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SEND_MEETUP_MSG',
        meetupId,
        content
      }));
    } else {
      console.warn('Socket no conectado. No se pudo enviar el mensaje de quedada.');
    }
  }, []);

  const joinMeetup = useCallback((meetupId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'JOIN_MEETUP',
        meetupId
      }));
    }
  }, []);

  const leaveMeetup = useCallback((meetupId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'LEAVE_MEETUP',
        meetupId
      }));
    }
  }, []);

  // --- CONECTAR AL WEBSOCKET ---

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws-chat`;

    console.log('Estableciendo conexión con el socket global de chat a ' + wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Conexión con /ws-chat establecida de forma segura.');
      // NOTE: WebSocket auth now relies on cookie being sent during handshake.
      // The backend should read the access_token cookie from the HTTP upgrade request.
      // For now, we send a placeholder IDENTIFY; the backend handler will need updating
      // to authenticate via cookie instead of token in message payload.
      socket.send(JSON.stringify({
        type: 'IDENTIFY'
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === 'IDENTIFIED') {
          console.log(`Socket de chat autenticado correctamente. User ID: ${data.userId}`);
          setConnected(true);
        }
        else if (type === 'DM_RECEIVED' || type === 'DM_SENT') {
          const { message } = data;
          
          // Si el callback de DMs está activo, enviarle el mensaje
          if (dmCallbackRef.current) {
            dmCallbackRef.current(message);
          }

          // Si es un mensaje recibido y NO estamos chateando con esa persona, lanzar un toast
          if (type === 'DM_RECEIVED') {
            const activeChatUserId = sessionStorage.getItem('enbido_active_chat_user_id');
            const isWindowActive = activeChatUserId === String(message.senderId);

            if (!isWindowActive) {
              // Reproducir efecto de sonido de mensaje usando ref
              settingsRef.current.playSfx('message');

              // Disparar toast si están habilitadas las notificaciones
              if (settingsRef.current.settings.notificationsEnabled && (settingsRef.current as any).triggerNotification) {
                const senderName = message.sender?.username || 'Un amigo';
                (settingsRef.current as any).triggerNotification(
                  `Mensaje de ${senderName}`,
                  message.content,
                  'message',
                  { friendId: message.senderId, username: senderName }
                );
              }
            }
          }
        }
        else if (type === 'MEETUP_MSG_RECEIVED') {
          const { message } = data;
          if (meetupCallbackRef.current) {
            meetupCallbackRef.current(message);
          }
        }
        else if (
          type === 'FRIEND_REQUEST_RECEIVED' ||
          type === 'FRIEND_REQUEST_ACCEPTED' ||
          type === 'FRIEND_DELETED' ||
          type === 'FRIEND_BLOCKED' ||
          type === 'FRIEND_UNBLOCKED' ||
          type === 'PRESENCE_CHANGE'
        ) {
          if (friendshipCallbackRef.current) {
            friendshipCallbackRef.current(data);
          }
        }
        else if (type === 'ERROR') {
          console.error('Mensaje de error del socket de chat:', data.message);
        }
      } catch (err) {
        console.error('Error al parsear mensaje de socket:', err);
      }
    };

    socket.onclose = (event) => {
      console.log(`Conexión con /ws-chat cerrada. Código: ${event.code}. Razón: ${event.reason}`);
      setConnected(false);

      // Intentar reconexión automática en 5 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    socket.onerror = (err) => {
      console.error('Error en el socket global de chat:', err);
      socket.close();
    };

  }, []);

  useEffect(() => {
    // Escuchar el login/logout del usuario conectándose en consecuencia
    connect();

    // Listener para eventos de login manual
    const handleLoginEvent = () => {
      connect();
    };

    window.addEventListener('enbido_login', handleLoginEvent);
    window.addEventListener('storage', handleLoginEvent);

    return () => {
      window.removeEventListener('enbido_login', handleLoginEvent);
      window.removeEventListener('storage', handleLoginEvent);
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return (
    <ChatWebSocketContext.Provider
      value={{
        connected,
        sendDirectMessage,
        sendMeetupMessage,
        joinMeetup,
        leaveMeetup,
        registerDmCallback,
        unregisterDmCallback,
        registerMeetupCallback,
        unregisterMeetupCallback,
        registerFriendshipCallback,
        unregisterFriendshipCallback
      }}
    >
      {children}
    </ChatWebSocketContext.Provider>
  );
};
