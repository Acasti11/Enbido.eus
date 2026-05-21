export interface TournamentDto {
  // Frontend original fields
  id?: number;
  tournamentName?: string;
  contactEmail?: string;
  tournamentLocation?: string;
  tournamentStructure?: string;
  tournamentDate?: string;
  tournamentTime?: string;
  maxParticipants?: string | number;
  inscriptionPrice?: string | number;
  tournamentPrizes?: string;
  otherDetails?: string;
  posterImage?: string;

  // Backend fields
  tournamentId?: number;
  title?: string;
  city?: string;
  specificLocation?: string;
  startDatetime?: string;
  entryFee?: number;
  maxTeams?: number;
  status?: string;
  organizerId?: number;
}

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
}
