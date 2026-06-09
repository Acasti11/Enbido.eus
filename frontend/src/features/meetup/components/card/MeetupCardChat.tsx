import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalMeetupAd } from '../../types/MeetupTypes';

interface MeetupCardChatProps {
  ad: LocalMeetupAd;
  participants: any[];
  messages: any[];
  newMessageText: string;
  setNewMessageText: (value: string) => void;
  currentUserId: number;
  isAuthenticated: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (e: React.FormEvent) => void;
}

const MeetupCardChat: React.FC<MeetupCardChatProps> = ({
  ad,
  participants,
  messages,
  newMessageText,
  setNewMessageText,
  currentUserId,
  isAuthenticated,
  chatEndRef,
  onSendMessage,
}): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="meetup-chat-section">
      <h5 className="meetup-chat-title">{t('meetup.playersInTable')}</h5>
      <div className="meetup-participants-list">
        <span className="participant-chip participant-chip--creator">
          👑 {ad.creatorName} ({t('meetup.creator')})
        </span>
        {participants.map((p) => (
          <span key={p.id} className="participant-chip">
            👤 {p.user ? p.user.name : t('meetup.userNumber', { num: p.userId })}
          </span>
        ))}
      </div>

      <h5 className="meetup-chat-title">{t('meetup.liveChat')}</h5>
      <div className="meetup-chat-window">
        {messages.length === 0 ? (
          <div className="meetup-chat-empty">
            {t('meetup.noMessages')}
          </div>
        ) : (
          messages.map((m) => {
            const isMsgFromMe = m.userId === currentUserId;
            const isMsgFromCreator = m.userId === ad.creatorId;
            const senderName = isMsgFromMe
              ? t('meetup.you')
              : m.user ? m.user.name : t('meetup.userNumber', { num: m.userId });

            return (
              <div
                key={m.messageId}
                className={`meetup-message-row ${isMsgFromMe ? 'meetup-message-row--me' : ''}`}
              >
                <span className={`meetup-message-sender ${isMsgFromCreator ? 'meetup-message-sender--creator' : ''}`}>
                  {senderName} {isMsgFromCreator ? `(${t('meetup.creator')})` : ''}
                </span>
                <span className="meetup-message-text">{m.content}</span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {isAuthenticated ? (
        <form onSubmit={onSendMessage} className="meetup-chat-form">
          <input
            type="text"
            className="meetup-chat-input"
            placeholder={t('meetup.writeMessage')}
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            maxLength={250}
          />
          <button type="submit" className="btn-send-message">{t('meetup.send')}</button>
        </form>
      ) : (
        <div className="meetup-chat-login-warning">
          {t('meetup.loginToChat')}
        </div>
      )}
    </div>
  );
};

export default MeetupCardChat;
