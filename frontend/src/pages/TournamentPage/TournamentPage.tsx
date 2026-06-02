import React, { useState, useEffect } from 'react';
import type { TournamentFormState, TournamentDto } from '../../types/tournament';
import { CONST_VIEW_LIST, CONST_VIEW_PUBLISH } from './constants';
import api from '../../services/api';

import TournamentList from './components/TournamentList';
import PublishForm from './components/PublishForm';
import './tournament.css';

interface TournamentBackendDto {
  tournamentId: number;
  title: string;
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
}

import { useSeo } from '../../hooks/useSeo';

const TournamentPage = (): React.JSX.Element => {
  useSeo({
    title: 'Torneos de Mus Online y Presenciales - Brackets | Enbido',
    description: 'Participa en nuestros torneos de Mus online y presenciales en Euskadi. Consulta clasificaciones, brackets, reglas y gana grandes recompensas.',
    keywords: 'torneos de mus, txapelketa, competicion mus, mus online, enbido, brackets de mus',
    canonical: 'https://enbido.eus/torneos',
    ogImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Lista de Torneos de Mus - Enbido',
      'url': 'https://enbido.eus/torneos',
      'description': 'Torneos oficiales y populares de Mus en línea y presenciales en Euskadi.',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Torneo de Mus Enbido'
        }
      ]
    }
  });

  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);



  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      const mapped = res.data.map((t: TournamentBackendDto) => ({
        id: t.tournamentId,
        tournamentName: t.title,
        contactEmail: t.organizer?.email || 'harreman@mus.eus',
        tournamentLocation: t.specificLocation + (t.city ? `, ${t.city}` : ''),
        tournamentStructure: 'professional',
        tournamentDate: t.startDatetime ? t.startDatetime.split('T')[0] : '',
        tournamentTime: t.startDatetime ? t.startDatetime.split('T')[1]?.substring(0, 5) : '',
        maxParticipants: String(t.maxTeams || 64),
        inscriptionPrice: String(t.entryFee || 0),
        coinsFee: String(t.coinsFee || 0),
        coinsReward: String(t.coinsReward || 0),
        status: t.status,
        organizerId: t.organizerId,
        tournamentPrizes: `1º: Txapela + ${t.coinsReward || 0} tx`,
        otherDetails: t.status === 'open' ? 'Inscripciones abiertas' : t.status === 'playing' ? 'En juego' : 'Finalizado',
        posterImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80'
      }));
      setTournamentsList(mapped);
    } catch (err) {
      console.error('Error fetching tournaments from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTournaments();
  }, []);



  const handleSaveTournament = async (newTournamentData: TournamentFormState) => {
    try {
      const payload = {
        title: newTournamentData.tournamentName,
        city: newTournamentData.tournamentLocation.split(',')[1]?.trim() || '',
        specificLocation: newTournamentData.tournamentLocation.split(',')[0]?.trim() || newTournamentData.tournamentLocation,
        startDatetime: `${newTournamentData.tournamentDate}T${newTournamentData.tournamentTime || '12:00'}:00`,
        entryFee: Number(newTournamentData.inscriptionPrice || 0),
        coinsFee: Number(newTournamentData.coinsFee || 0),
        coinsReward: Number(newTournamentData.coinsReward || 0),
        maxTeams: Number(newTournamentData.maxParticipants || 8),
        status: 'open'
      };

      const res = await api.post('/tournaments', payload);
      const saved = res.data;

      const newTournament: TournamentDto = {
        id: saved.tournamentId,
        tournamentName: saved.title,
        contactEmail: saved.organizer?.email || newTournamentData.contactEmail || 'harreman@mus.eus',
        tournamentLocation: saved.specificLocation + (saved.city ? `, ${saved.city}` : ''),
        tournamentStructure: newTournamentData.tournamentStructure || 'professional',
        tournamentDate: saved.startDatetime ? saved.startDatetime.split('T')[0] : newTournamentData.tournamentDate,
        tournamentTime: saved.startDatetime ? saved.startDatetime.split('T')[1]?.substring(0, 5) : newTournamentData.tournamentTime,
        maxParticipants: String(saved.maxTeams || newTournamentData.maxParticipants),
        inscriptionPrice: String(saved.entryFee || newTournamentData.inscriptionPrice),
        coinsFee: String(saved.coinsFee || newTournamentData.coinsFee),
        coinsReward: String(saved.coinsReward || newTournamentData.coinsReward),
        status: saved.status,
        organizerId: saved.organizerId,
        tournamentPrizes: `1º: Txapela + ${saved.coinsReward || 0} tx`,
        otherDetails: 'Inscripciones abiertas',
        posterImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80'
      };

      setTournamentsList((prevList) => [newTournament, ...prevList]);
      setCurrentView(CONST_VIEW_LIST);
    } catch (err) {
      console.error('Error saving tournament to DB:', err);
      alert('Inicia sesión para poder publicar torneos');
    }
  };

  return (
    <div className="tournament-app-wrapper">
      <main className="page-content">
        {loading ? (
          <div className="tourney-list-loading-box">
            <div className="lobby-loader tourney-list-loading-spinner"></div>
            Kargatzen / Cargando...
          </div>
        ) : (
          <>
            {currentView === CONST_VIEW_LIST && (
              <TournamentList
                tournaments={tournamentsList}
                onPublish={() => setCurrentView(CONST_VIEW_PUBLISH)}
              />
            )}
            {currentView === CONST_VIEW_PUBLISH && (
              <PublishForm
                onAddTournament={handleSaveTournament}
                onCancelPublish={() => setCurrentView(CONST_VIEW_LIST)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TournamentPage;