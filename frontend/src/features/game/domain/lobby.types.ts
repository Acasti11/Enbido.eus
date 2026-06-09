export interface ParticipantInfo {
  userId: number;
  username: string;
}

export interface MatchInfo {
  matchId: number;
  tournamentId: number;
  roundNumber: number;
  matchIndex: number;
  player1Id: number | null;
  player2Id: number | null;
  player1PartnerId: number | null;
  player2PartnerId: number | null;
  winnerId: number | null;
  score: string;
  player1Ready?: boolean;
  player2Ready?: boolean;
  player1PartnerReady?: boolean;
  player2PartnerReady?: boolean;
  roundStartTime?: string;
  isCompleted?: boolean;
  gameRoomId?: string;
}

export interface TournamentBackendDto {
  tournamentId: number;
  id?: number;
  title: string;
  tournamentName?: string;
  city: string;
  specificLocation: string;
  startDatetime: string;
  entryFee: number;
  maxTeams: number;
  status: string;
  coinsFee: number;
  coinsReward: number;
  organizerId: number;
  organizer: {
    email: string;
  } | null;
  posterImage?: string;
}

export interface TournamentDetails {
  tournament: TournamentBackendDto;
  participants: ParticipantInfo[];
  matches: MatchInfo[];
}

export interface PremiumLobbyProps {
  username: string;
  isSearching: boolean;
  queueSize: number;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomId: string) => void;
  onStartMatchmaking: (reyes: '4' | '8') => void;
  onCancelMatchmaking: () => void;
}

export interface UserProfile {
  elo: number;
  coins: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
}

export interface Friend {
  id: number;
  username: string;
  elo: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  status: 'online' | 'offline';
  isBot?: boolean;
  friendshipId?: number;
}

export interface UserLeaderboardDto {
  userId: number;
  username: string;
  elo: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  winRate: number;
  equippedTitle: string;
}

export interface PendingRequest {
  friendshipId: number;
  username: string;
  type: 'received' | 'sent';
}

export interface SearchUserDto {
  user_id: number;
  username: string;
  elo?: number;
}
