export interface LocalMeetupAd {
  adId: number;
  creatorId: number;
  creatorName: string;
  location: string;
  missingPlayers: number;
  description: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  establishmentType?: string;
}

export interface CreateAdFormState {
  location: string;
  missingPlayers: string;
  description: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  establishmentType?: string;
}

export interface MeetupApiResponse {
  adId: number;
  creatorId: number;
  creator?: { name: string };
  location: string;
  missingPlayers: number;
  description: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  establishmentType?: string;
}

export type MeetupView = 'list' | 'create';
