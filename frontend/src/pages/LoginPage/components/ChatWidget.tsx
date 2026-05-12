import React from 'react';
import ChatPanel from './ChatPanel';
import './chat-widget.css';

const ChatWidget: React.FC = (): React.JSX.Element => {
  return (
    <div className="chat-widget">
      <ChatPanel />
      <button className="chat-widget__toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="chat-widget__tooltip">Learn to play</span>
      </button>
    </div>
  );
};

export default ChatWidget;