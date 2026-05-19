import type { TournamentFormState, TournamentDto } from '../../types/tournament';

export const CONST_VIEW_LIST = 'LIST';
export const CONST_VIEW_PUBLISH = 'PUBLISH';
export const CONST_CONTACT_EMAIL = 'harreman@mus.eus';

export const CONST_INITIAL_FORM_STATE: TournamentFormState = {
  tournamentName: '',
  contactEmail: '',
  tournamentLocation: '',
  tournamentStructure: '',
  tournamentDate: '',
  tournamentTime: '',
  maxParticipants: '',
  inscriptionPrice: '',
  tournamentPrizes: '',
  otherDetails: '',
  posterImage: ''
};

export const CONST_INITIAL_TOURNAMENTS: TournamentDto[] = [
  {
    id: 1,
    tournamentName: 'Txapelketa Nagusia Arrasate',
    contactEmail: 'arrasate@mus.eus',
    tournamentLocation: 'Kulturate, Arrasate',
    tournamentStructure: 'association',
    tournamentDate: '2026-06-15',
    tournamentTime: '16:00',
    maxParticipants: '64',
    inscriptionPrice: '20',
    tournamentPrizes: '1º: 500€ + Txapela, 2º: 200€',
    otherDetails: 'Afaria barne / Cena incluida',
    posterImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    tournamentName: 'Gran Premio Bilbao',
    contactEmail: 'bilbo@mus.eus',
    tournamentLocation: 'BEC Barakaldo',
    tournamentStructure: 'professional',
    tournamentDate: '2026-07-01',
    tournamentTime: '10:00',
    maxParticipants: '128',
    inscriptionPrice: '50',
    tournamentPrizes: '1º: 2000€, 2º: 800€, 3º: 300€',
    otherDetails: 'Puntuagarria / Puntuable',
    posterImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80'
  }
];