import React from 'react';
import '../styles/chat-panel.css';

const INITIAL_MESSAGE = "Hello! I'm the Mus Master. Do you have questions about the rules, card values, or how to throw an 'ordago'?";

const ChatPanel: React.FC = (): React.JSX.Element | null => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <div className="chat-panel__avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 12 2.1 12" />
            <path d="M12 12 21.9 12" />
            <path d="M12 12 12 21.9" />
            <path d="M12 12 12 2.1" />
          </svg>
        </div>
        <div>
          <h3 className="chat-panel__title">Mus Master</h3>
          <p className="chat-panel__subtitle">ENBIDO AI Assistant</p>
        </div>
        <button className="chat-panel__close" onClick={() => setIsOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="chat-panel__messages">
        <div className="chat-panel__message chat-panel__message--bot">
          <div className="chat-panel__bubble chat-panel__bubble--bot">
            {INITIAL_MESSAGE}
          </div>
        </div>
      </div>

      <div className="chat-panel__input-area">
        <input
          type="text"
          placeholder="Ask about Mus..."
          className="chat-panel__input"
        />
        <button className="chat-panel__send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;