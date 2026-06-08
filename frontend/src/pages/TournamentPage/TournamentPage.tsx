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
  type?: string;
  coinsFee: number;
  coinsReward: number;
  organizerId: number;
  organizer: {
    email: string;
  } | null;
}

import { useSeo } from '../../hooks/useSeo';
import { useAuth } from '../../context/AuthContext';

const convertUtcToLocal = (utcString: string): { date: string; time: string } => {
  if (!utcString) return { date: '', time: '' };
  const isoString = utcString.endsWith('Z') ? utcString : utcString + 'Z';
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) {
    const parts = utcString.split('T');
    return { date: parts[0] || '', time: parts[1]?.substring(0, 5) || '' };
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
};

const convertLocalToUtc = (localDate: string, localTime: string): string => {
  if (!localDate) return '';
  const localDateTimeStr = `${localDate}T${localTime || '12:00'}:00`;
  const dateObj = new Date(localDateTimeStr);
  if (isNaN(dateObj.getTime())) {
    return localDateTimeStr;
  }
  return dateObj.toISOString().substring(0, 19);
};

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
      const mapped = res.data.map((t: TournamentBackendDto) => {
        const local = convertUtcToLocal(t.startDatetime);
        return {
          id: t.tournamentId,
          tournamentName: t.title,
          contactEmail: t.organizer?.email || 'enbidoeus@gmail.com',
          tournamentLocation: t.specificLocation + (t.city ? `, ${t.city}` : ''),
          tournamentStructure: 'professional',
          tournamentDate: local.date,
          tournamentTime: local.time,
          maxParticipants: String(t.maxTeams || 64),
          inscriptionPrice: String(t.entryFee || 0),
          coinsFee: String(t.coinsFee || 0),
          coinsReward: String(t.coinsReward || 0),
          status: t.status,
          type: (t.type as 'ONLINE' | 'PRESENCIAL') || 'PRESENCIAL',
          organizerId: t.organizerId,
          tournamentPrizes: `1º: Txapela + ${t.coinsReward || 0} tx`,
          otherDetails: t.status === 'open' ? 'Inscripciones abiertas' : t.status === 'playing' ? 'En juego' : 'Finalizado',
          posterImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80'
        };
      });
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

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleDeleteTournament = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres borrar este torneo?')) {
      return;
    }
    try {
      await api.delete(`/tournaments/${id}`);
      setTournamentsList((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Error deleting tournament:', err);
      const axiosErr = err as { response?: { data?: { message?: string } | string } };
      const data = axiosErr?.response?.data;
      const errorMsg = (typeof data === 'object' && data !== null && 'message' in data ? data.message : data) || 'Error al borrar el torneo';
      alert(errorMsg);
    }
  };

  const handleSaveTournament = async (newTournamentData: TournamentFormState) => {
    try {
      const utcStartDatetime = convertLocalToUtc(newTournamentData.tournamentDate, newTournamentData.tournamentTime);
      const payload = {
        title: newTournamentData.tournamentName,
        city: newTournamentData.tournamentLocation.split(',')[1]?.trim() || '',
        specificLocation: newTournamentData.tournamentLocation.split(',')[0]?.trim() || newTournamentData.tournamentLocation,
        startDatetime: utcStartDatetime,
        entryFee: Number(newTournamentData.inscriptionPrice || 0),
        coinsFee: Number(newTournamentData.coinsFee || 0),
        coinsReward: Number(newTournamentData.coinsReward || 0),
        maxTeams: Number(newTournamentData.maxParticipants || 8),
        status: 'open',
        type: 'PRESENCIAL'
      };

      const res = await api.post('/tournaments', payload);
      const saved = res.data;
      const savedLocal = convertUtcToLocal(saved.startDatetime);

      const newTournament: TournamentDto = {
        id: saved.tournamentId,
        tournamentName: saved.title,
        contactEmail: saved.organizer?.email || newTournamentData.contactEmail || 'enbidoeus@gmail.com',
        tournamentLocation: saved.specificLocation + (saved.city ? `, ${saved.city}` : ''),
        tournamentStructure: newTournamentData.tournamentStructure || 'professional',
        tournamentDate: savedLocal.date,
        tournamentTime: savedLocal.time,
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
      <div className="page-content">
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
                isAdmin={isAdmin}
                onDelete={handleDeleteTournament}
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
      </div>
    </div>
  );
};

export default TournamentPage;