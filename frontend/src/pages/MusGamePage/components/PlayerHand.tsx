import React from 'react';
import type { CardItem } from '../../../types/MusGame';

interface PlayerHandProps {
  hand: CardItem[]; // Cambiado de Card[] a CardItem[]
  isBot: boolean;
  selectedCards?: string[];
  isSelectable?: boolean;
  onCardClick?: (cardId: string) => void;
  deckItemId?: number;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isBot,
  selectedCards = [],
  isSelectable = false,
  onCardClick,
  deckItemId,
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
      
      let deckSkinClass = "";
      if (deckItemId === 3) deckSkinClass = " euskal-back";
      if (deckItemId === 4) deckSkinClass = " gau-beltza-back";

      if (isBot) {
        return (
          <div key={card.id} className={`card card-back${deckSkinClass}`}>
            <div className="card-back-pattern"></div>
          </div>
        );
      }

      return (
        <div
          key={card.id}
          className={`card card-front${deckSkinClass} ${isSelected ? 'is-selected-discard' : ''} ${isSelectable ? 'is-hoverable' : ''}`}
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