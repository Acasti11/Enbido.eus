import type { CardItem, CardSuit } from '@/features/game/types/MusGame';

const CONST_SUITS: CardSuit[] = ['Oros', 'Copas', 'Espadas', 'Bastos'];
const CONST_RANKS: number[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

export const calculateCardScore = (rank: number): number => {
  if (rank === 12 || rank === 3 || rank === 11 || rank === 10) return 10;
  if (rank === 1 || rank === 2) return 1;
  return rank;
};

// Se inicializan TODAS las propiedades obligatorias de CardItem
export const createNewDeck = (): CardItem[] => {
  return CONST_SUITS.flatMap((suit) =>
    CONST_RANKS.map((rank) => ({
      id: `${rank}-${suit}`,
      suit,
      rank,
      scoreValue: calculateCardScore(rank),
      imagePath: `/assets/cards/${rank}-${suit}.png`,
      isSelected: false,
    }))
  );
};

export const shuffleCardDeck = (deck: CardItem[]): CardItem[] => {
  return [...deck].sort(() => Math.random() - 0.5);
};