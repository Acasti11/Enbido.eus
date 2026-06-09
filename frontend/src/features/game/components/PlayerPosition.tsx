import React from 'react';
import { TimerCircle } from './TimerCircle';
import PlayerHand from './PlayerHand';

interface PlayerPositionProps {
  position: 'north' | 'west' | 'east' | 'south';
  index: number;
  timeLeft: number;
  activeTurnIdx: number;
  seats: any[];
  botHands: any[][];
  isPlaying: boolean;
  phase: string;
  dealerIdx: number;
  speechBubbles: { [key: number]: string | null };
  activeSigns: { [key: number]: string | null };
  profile: any;
  playerHand?: any[];
  selectedCards?: string[];
  toggleCardSelection?: (cardId: string) => void;
  getSignEmojiOnly: (key: string) => string;
  t: (key: string) => string;
  isSignsOpen?: boolean;
  setIsSignsOpen?: (isOpen: boolean) => void;
  sendSign?: (signKey: string) => void;
}

export const PlayerPosition: React.FC<PlayerPositionProps> = ({
  position, index, timeLeft, activeTurnIdx, seats, botHands, isPlaying,
  phase, dealerIdx, speechBubbles, activeSigns, profile, playerHand,
  selectedCards, toggleCardSelection, getSignEmojiOnly, t,
  isSignsOpen, setIsSignsOpen, sendSign
}) => {
  const isBot = position !== 'south';
  const hand = isBot ? botHands[position === 'north' ? 0 : position === 'west' ? 2 : 1] : playerHand || [];

  const getBotName = (): string => {
    if (position === 'north') return t('musGame.botNorth');
    if (position === 'west') return t('musGame.botWest');
    return t('musGame.botEast');
  };

  const username = seats[index]?.username || getBotName();
  const isSelf = position === 'south';
  const displayName = isSelf ? `${username} (${t('musGame.you')})` : username;

  const absChair = seats[index]?.chair;
  const isTurnActive = absChair !== undefined && activeTurnIdx === absChair;
  const signType = absChair !== undefined ? activeSigns[absChair] : undefined;
  const manoIdx = (dealerIdx + 1) % 4;
  const isMano = absChair !== undefined && manoIdx === absChair;

  let avatarSkinClass = '';
  if (profile?.equippedAvatarItemId === 1) avatarSkinClass = 'avatar-ring-gold';
  else if (profile?.equippedAvatarItemId === 2) avatarSkinClass = 'avatar-ring-green';
  else if (profile?.equippedAvatarItemId === 7) avatarSkinClass = 'avatar-ring-ikurrina';
  else if (profile?.equippedAvatarItemId === 8) avatarSkinClass = 'avatar-ring-karta';

  const avatarClass = isSelf
    ? `player-theme ${signType ? 'has-active-sign' : ''} ${avatarSkinClass}`
    : position === 'north'
    ? `partner-theme ${signType ? 'has-active-sign' : ''}`
    : `rival-theme ${signType ? 'has-active-sign' : ''}`;

  return (
    <div className={`player-position position-${position} ${isTurnActive ? 'active-zone' : ''}`}>
      <div className="player-profile-row">
        <div className="player-avatar-card">
          <div className="player-avatar-wrapper">
            <TimerCircle timeLeft={timeLeft} isActive={isTurnActive} />
            <div className={`player-avatar-circle ${avatarClass}`}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            {isTurnActive && timeLeft > 0 && (
              <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
                {timeLeft}s
              </div>
            )}
            {signType && (
              <div className="mus-sign-badge pop-in">
                <div className="mus-sign-badge-glow"></div>
                <span className="mus-sign-badge-text">
                  {getSignEmojiOnly(signType)}
                </span>
              </div>
            )}
            {isMano && (
              <div className="mano-badge" title={t('musGame.manoTooltip')}>
                <span className="mano-badge__label">{t('musGame.manoLabel')}</span>
                <span className="mano-badge__sub">{t('musGame.manoSub')}</span>
              </div>
            )}
          </div>
          <div className="player-avatar-details">
            <span className="player-name-label">{displayName}</span>
            {isSelf && profile?.equippedTitleItemId === 5 && <span className="player-title-badge player-title-badge--green">{t('musGame.titleHandia')}</span>}
            {isSelf && profile?.equippedTitleItemId === 6 && <span className="player-title-badge player-title-badge--gold">{t('musGame.titleEnbidoMaisu')}</span>}
          </div>
        </div>

        {isSelf && isPlaying && sendSign && setIsSignsOpen && (
          <div className="senas-dropdown-container">
            <button
              type="button"
              className="btn-senas-toggle"
              onClick={() => setIsSignsOpen(!isSignsOpen)}
              title={t('musGame.openSignsMenu')}
            >
              {t('musGame.signs')}
            </button>
            {isSignsOpen && (
              <div className="senas-popup-menu">
                <span className="senas-menu-title">{t('musGame.makeSign')}</span>
                <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('dos_reyes'); setIsSignsOpen(false); }}>
                  {t('musGame.signReyes')}
                </button>
                <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('dos_ases'); setIsSignsOpen(false); }}>
                  {t('musGame.signAses')}
                </button>
                <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('medias'); setIsSignsOpen(false); }}>
                  {t('musGame.signMedias')}
                </button>
                <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('duples'); setIsSignsOpen(false); }}>
                  {t('musGame.signDuples')}
                </button>
                <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('31'); setIsSignsOpen(false); }}>
                  {t('musGame.sign31')}
                </button>
                <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('30'); setIsSignsOpen(false); }}>
                  {t('musGame.sign30')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="player-hand-wrapper">
        <div className="player-cards-slot-bg">
          <div className="slot-outline-card"></div>
          <div className="slot-outline-card"></div>
          <div className="slot-outline-card"></div>
          <div className="slot-outline-card"></div>
        </div>
        <PlayerHand
          hand={isPlaying ? hand : []}
          isBot={isBot && phase !== 'round-over'}
          isSelectable={isSelf && phase === 'discarding'}
          selectedCards={selectedCards}
          onCardClick={toggleCardSelection}
          equippedDeckItemId={profile?.equippedDeckItemId}
        />
      </div>
      {speechBubbles[index] && <div className="speech-bubble show">{speechBubbles[index]}</div>}
    </div>
  );
};
