import React from 'react';
import { useTranslation } from 'react-i18next';
import './meetup-ad-card.css';
import type { LocalMeetupAd } from '../types/MeetupTypes';
import { useMeetupCard } from '../hooks/useMeetupCard';
import MeetupCardHeader from './card/MeetupCardHeader';
import MeetupCardActions from './card/MeetupCardActions';
import MeetupCardChat from './card/MeetupCardChat';

interface MeetupCardProps {
  ad: LocalMeetupAd;
  isHighlighted?: boolean;
  onDelete?: (adId: number) => void;
}

const MeetupAdCard: React.FC<MeetupCardProps> = ({ ad, isHighlighted, onDelete }): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    adState,
    isChatOpen,
    setIsChatOpen,
    participants,
    messages,
    newMessageText,
    setNewMessageText,
    hasJoined,
    currentUserId,
    isAuthenticated,
    isCreator,
    isFull,
    chatEndRef,
    handleContactOrganizer,
    handleJoin,
    handleLeave,
    handleDelete,
    handleShare,
    handleSendMessage,
  } = useMeetupCard(ad, onDelete);

  return (
    <article className={`ad-card ${isHighlighted ? 'map-highlighted' : ''}`} id={`ad-card-${adState.adId}`}>
      <MeetupCardHeader ad={adState} />

      <div className="ad-card__body">
        <span className="ad-card__players">
          {isFull ? t('meetup.tableFull') : t('meetup.missingPlayers', { count: adState.missingPlayers })}
        </span>
        <p className="ad-card__desc">{adState.description}</p>
      </div>

      <MeetupCardActions
        isCreator={isCreator}
        isFull={isFull}
        hasJoined={hasJoined}
        isAuthenticated={isAuthenticated}
        latitude={adState.latitude}
        longitude={adState.longitude}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onDelete={handleDelete}
        onShare={handleShare}
        onContact={handleContactOrganizer}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {isChatOpen && (hasJoined || isCreator) && (
        <MeetupCardChat
          ad={adState}
          participants={participants}
          messages={messages}
          newMessageText={newMessageText}
          setNewMessageText={setNewMessageText}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
          chatEndRef={chatEndRef}
          onSendMessage={handleSendMessage}
        />
      )}
    </article>
  );
};

export default MeetupAdCard;
