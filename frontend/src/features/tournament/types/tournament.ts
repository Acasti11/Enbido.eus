export interface TournamentFormState {
  tournamentName: string;
  contactEmail: string;
  tournamentLocation: string;
  tournamentStructure: string;
  tournamentDate: string;
  tournamentTime: string;
  maxParticipants: string;
  inscriptionPrice: string;
  tournamentPrizes: string;
  otherDetails: string;
  posterImage: string;
  coinsFee?: string;
  coinsReward?: string;
}

export interface TournamentDto extends TournamentFormState {
  id: number;
  status?: 'open' | 'playing' | 'finished' | 'cancelled';
  organizerId?: number;
  type?: 'ONLINE' | 'PRESENCIAL';
}