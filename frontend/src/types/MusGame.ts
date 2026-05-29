// 1. Tipos de cartas (Asegurado que tiene todas las propiedades)
export type CardSuit = 'Oros' | 'Copas' | 'Espadas' | 'Bastos';

export interface CardItem {
  id: string;
  suit: CardSuit;
  rank: number;
  scoreValue: number;
  imagePath: string;
  isSelected: boolean;
}

// 2. Fases exactas que usa el ActionPanel
export type GamePhase = 
  | 'init' 
  | 'dealing' 
  | 'mus-check' 
  | 'discarding' 
  | 'betting' 
  | 'round-over';

export type BettingStage = 'grande' | 'chica' | 'pares' | 'juego' | 'punto';

// 3. Estructuras del juego y la Base de Datos
export interface GameScore {
  us: number;
  them: number;
  roundsUs?: number;
  roundsThem?: number;
}

export interface LogEntry {
  id: string;
  message: string;
}

export interface GameMatchDto {
  id?: number;
  userId: number;
  scoreUs: number;
  scoreThem: number;
  status: 'IN_PROGRESS' | 'FINISHED';
}