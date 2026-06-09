import React from 'react';
import type { CardItem } from '@/features/game/types/MusGame';

interface PlayerHandProps {
  hand: CardItem[];
  isBot: boolean;
  selectedCards?: string[];
  isSelectable?: boolean;
  onCardClick?: (cardId: string) => void;
  equippedDeckItemId?: number;
}

// Custom Premium Vector SVGs for the traditional Spanish deck suits
const SuitEmblem: React.FC<{ suit: string; size?: number; className?: string }> = ({ suit, size = 24, className }) => {
  const s = suit.toLowerCase();

  if (s === 'oros') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="url(#goldGrad)" stroke="#c49b10" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="7" stroke="#b0840b" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M12 7v10M9 12h6" stroke="#906900" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="#ffe259" opacity="0.3" />
        <defs>
          <radialGradient id="goldGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#fff6ad" />
            <stop offset="50%" stopColor="#dca10d" />
            <stop offset="100%" stopColor="#966c00" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (s === 'copas') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M5 4h14v5c0 3.866-3.134 7-7 7s-7-3.134-7-7V4z" fill="url(#copaGrad)" stroke="#b91c1c" strokeWidth="1.2" />
        <path d="M12 16v5M8 21h8" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 7h10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 12h4" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" />
        <defs>
          <linearGradient id="copaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (s === 'espadas') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2l2.5 3.5v11l-2.5 2-2.5-2v-11L12 2z" fill="url(#espadaGrad)" stroke="#1e40af" strokeWidth="1.2" />
        <path d="M7 16.5h10M12 16.5v4.5" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="21" r="1.5" fill="#1e3a8a" />
        <path d="M12 4.5v11.5" stroke="#eff6ff" strokeWidth="0.8" opacity="0.6" />
        <defs>
          <linearGradient id="espadaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3c-1.8 0-2.8 1.8-2.2 4l1.2 6.5h2L14.2 7c.6-2.2-.4-4-2.2-4z" fill="url(#bastoGrad)" stroke="#065f46" strokeWidth="1.2" />
      <path d="M7.5 11c-1.5-.8-3 0-3 1.5s1 2.2 3 1.8h9c2 .4 3-.3 3-1.8s-1.5-2.3-3-1.5" fill="url(#bastoGrad)" stroke="#065f46" strokeWidth="1.2" />
      <path d="M11.2 16l-.7 5h3l-.7-5" fill="#047857" stroke="#064e3b" strokeWidth="1.2" />
      <defs>
        <linearGradient id="bastoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isBot,
  selectedCards = [],
  isSelectable = false,
  onCardClick,
  equippedDeckItemId,
}): React.JSX.Element => {

  const handleCardClick = (cardId: string): void => {
    if (isSelectable && onCardClick) {
      onCardClick(cardId);
    }
  };

  const getCardBackClass = (): string => {
    let cardBackClass = 'card card-back';
    if (equippedDeckItemId === 3) {
      cardBackClass = 'card card-back euskal-back';
    } else if (equippedDeckItemId === 4) {
      cardBackClass = 'card card-back gau-beltza-back';
    } else if (equippedDeckItemId === 9) {
      cardBackClass = 'card card-back klasikoa-back';
    } else if (equippedDeckItemId === 10) {
      cardBackClass = 'card card-back berezia-back';
    }
    return cardBackClass;
  };

  const getCardFrontClass = (isSelected: boolean): string => {
    let cardFrontClass = `card card-front ${isSelected ? 'is-selected-discard' : ''} ${isSelectable ? 'is-hoverable' : ''}`;
    if (equippedDeckItemId === 3) {
      cardFrontClass += ' euskal-front';
    } else if (equippedDeckItemId === 4) {
      cardFrontClass += ' gau-beltza-front';
    } else if (equippedDeckItemId === 9) {
      cardFrontClass += ' klasikoa-front';
    } else if (equippedDeckItemId === 10) {
      cardFrontClass += ' berezia-front';
    }
    return cardFrontClass;
  };

  const renderCards = (): React.JSX.Element[] => {
    if (hand.length === 0) {
      return Array(4).fill(null).map((_, index) => (
        <div key={index} className="card-placeholder">
          <div className="card-placeholder-inner">?</div>
        </div>
      ));
    }

    return hand.map((card) => {
      const isSelected = selectedCards.includes(card.id);

      if (isBot) {
        return (
          <div key={card.id} className={getCardBackClass()}>
            <div className="card-back-pattern"></div>
          </div>
        );
      }

      return (
        <div
          key={card.id}
          className={getCardFrontClass(isSelected)}
          onClick={() => handleCardClick(card.id)}
        >
          <div className="card-border-frame"></div>

          <div className="card-index-corner top-left">
            <span className="card-rank-text">{card.rank}</span>
            <SuitEmblem suit={card.suit} size={11} className="card-suit-tiny" />
          </div>

          <div className="card-emblem-center">
            <SuitEmblem suit={card.suit} size={36} />
          </div>

          <div className="card-index-corner bottom-right">
            <span className="card-rank-text">{card.rank}</span>
            <SuitEmblem suit={card.suit} size={11} className="card-suit-tiny" />
          </div>
        </div>
      );
    });
  };

  return <div className="hand-container">{renderCards()}</div>;
};

export default PlayerHand;
