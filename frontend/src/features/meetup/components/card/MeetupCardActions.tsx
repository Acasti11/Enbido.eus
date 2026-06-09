import React from 'react';
import { useTranslation } from 'react-i18next';

interface MeetupCardActionsProps {
  isCreator: boolean;
  isFull: boolean;
  hasJoined: boolean;
  isAuthenticated: boolean;
  latitude?: number;
  longitude?: number;
  onJoin: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onShare: () => void;
  onContact: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

const MeetupCardActions: React.FC<MeetupCardActionsProps> = ({
  isCreator,
  isFull,
  hasJoined,
  isAuthenticated,
  latitude,
  longitude,
  onJoin,
  onLeave,
  onDelete,
  onShare,
  onContact,
  onToggleChat,
  isChatOpen,
}): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="ad-card__actions">
      {hasJoined ? (
        <>
          <button className="btn-join btn-joined" disabled>
            {t('meetup.joined')}
          </button>
          <button className="btn-leave-meetup" onClick={onLeave}>
            {t('meetup.leaveTable')}
          </button>
        </>
      ) : (
        <button
          className="btn-join"
          onClick={onJoin}
          disabled={isCreator || isFull || !isAuthenticated}
        >
          {isCreator
            ? t('meetup.organizer')
            : isFull
              ? t('meetup.tableFull')
              : t('meetup.joinTable')}
        </button>
      )}

      {isCreator && (
        <button className="btn-delete-meetup" onClick={onDelete} title={t('meetup.confirmDelete')}>
          {t('meetup.delete')}
        </button>
      )}

      {latitude && longitude && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-maps-link"
          title={t('meetup.howToGetThere')}
        >
          {t('meetup.howToGetThere')}
        </a>
      )}

      <button className="btn-chat-toggle btn-share-link" onClick={onShare} title={t('meetup.share')}>
        {t('meetup.share')}
      </button>

      {!isCreator && (
        <button
          type="button"
          className="btn-chat-toggle btn-chat-contact"
          onClick={onContact}
          title={t('meetup.contact')}
        >
          {t('meetup.contact')}
        </button>
      )}
      {(hasJoined || isCreator) && (
        <button
          className="btn-chat-toggle"
          onClick={onToggleChat}
        >
          {t('meetup.chat')} {isChatOpen ? '▲' : '▼'}
        </button>
      )}
    </div>
  );
};

export default MeetupCardActions;
