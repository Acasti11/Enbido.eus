import React, { useRef, useEffect } from 'react';
import { useChat } from '@/features/chat/hooks/ChatContext';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useTranslation } from 'react-i18next';
import './global-chat.css';

const useGameActive = () => {
  const [isGameActive, setIsGameActive] = React.useState(false);
  useEffect(() => {
    const check = () => setIsGameActive(localStorage.getItem('isGameActive') === 'true');
    check();
    window.addEventListener('game_state_changed', check);
    return () => window.removeEventListener('game_state_changed', check);
  }, []);
  return isGameActive;
};

const GlobalChatWindow: React.FC = () => {
  const {
    activeChatUser,
    chatMessages,
    chatInput,
    isChatOpen,
    closeChat,
    setChatInput,
    sendMessage
  } = useChat();
  
  const { t } = useTranslation();
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.userId || 0;
  const isGameActive = useGameActive();

  if (isGameActive) return null;

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  if (!isChatOpen || !activeChatUser) return null;

  return (
    <div className="global-chat-window">
      <header className="global-chat-header">
        <div className="global-chat-header-user">
          <span className={`global-chat-status-dot ${activeChatUser.status === 'online' ? 'global-chat-status-dot--online' : 'global-chat-status-dot--offline'}`} />
          <span className="global-chat-header-name">
            {t('premiumLobby.chatWith', { username: activeChatUser.username })}
          </span>
        </div>
        <button className="global-chat-close-btn" onClick={closeChat}>
          &times;
        </button>
      </header>

      <div className="global-chat-messages" ref={chatEndRef}>
        {chatMessages.length === 0 ? (
          <div className="global-chat-empty">
            {t('premiumLobby.noPrivateMessages')}
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={index}
                className={`global-chat-msg-row ${isMe ? 'global-chat-msg-row--sent' : 'global-chat-msg-row--received'}`}
              >
                <span className={`global-chat-msg-sender ${isMe ? 'global-chat-msg-sender--me' : 'global-chat-msg-sender--other'}`}>
                  {msg.senderName}
                </span>
                <span className="global-chat-msg-content">{msg.content}</span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="global-chat-input-form">
        <input
          type="text"
          className="global-chat-input"
          placeholder={t('premiumLobby.writeMessage')}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          required
        />
        <button type="submit" className="global-chat-send-btn">
          {t('premiumLobby.send')}
        </button>
      </form>
    </div>
  );
};

export default GlobalChatWindow;
