import React from 'react';
import type { CardItem } from '../../../types/MusGame';

interface PlayerHandProps {
  hand: CardItem[]; // Cambiado de Card[] a CardItem[]
  isBot: boolean;
  selectedCards?: string[];
  isSelectable?: boolean;
  onCardClick?: (cardId: string) => void;
  equippedDeckItemId?: number;
}

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

  const renderCards = (): React.JSX.Element[] => {
    // Si no hay cartas aún
    if (hand.length === 0) {
      return Array(4).fill(null).map((_, index) => (
        <div key={index} className="card-placeholder">?</div>
      ));
    }

    return hand.map((card) => {
      const isSelected = selectedCards.includes(card.id);
      
      if (isBot) {
        let cardBackClass = 'card card-back';
        if (equippedDeckItemId === 3) {
          cardBackClass = 'card card-back euskal-back';
        } else if (equippedDeckItemId === 4) {
          cardBackClass = 'card card-back gau-beltza-back';
        }
        return (
          <div key={card.id} className={cardBackClass}>
            <div className="card-back-pattern"></div>
          </div>
        );
      }

      let cardFrontClass = `card card-front ${isSelected ? 'is-selected-discard' : ''} ${isSelectable ? 'is-hoverable' : ''}`;
      if (equippedDeckItemId === 3) {
        cardFrontClass += ' euskal-front';
      } else if (equippedDeckItemId === 4) {
        cardFrontClass += ' gau-beltza-front';
      }

      return (
        <div
          key={card.id}
          className={cardFrontClass}
          onClick={() => handleCardClick(card.id)}
        >
          <div className="card-suit-corner top-left">{card.suit[0]}</div>
          <div className="card-rank">{card.rank === 12 ? 'R' : card.rank === 11 ? 'C' : card.rank === 10 ? 'S' : card.rank}</div>
          <div className="card-suit-emblem">{card.suit}</div>
        </div>
      );
    });
  };

  return <div className="hand-container">{renderCards()}</div>;
};

export default PlayerHand;