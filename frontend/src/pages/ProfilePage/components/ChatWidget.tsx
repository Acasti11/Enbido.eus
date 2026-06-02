import React from 'react';
import { useTranslation } from 'react-i18next';
import ChatPanel from '../../LoginPage/components/ChatPanel';
import '../../LoginPage/styles/chat-widget.css';

const ChatWidget: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`chat-widget ${isOpen ? 'chat-widget--open' : ''}`}>
      <button
        className="chat-widget__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.toggleChat')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      {isOpen && <ChatPanel />}
    </div>
  );
};

export default ChatWidget;
