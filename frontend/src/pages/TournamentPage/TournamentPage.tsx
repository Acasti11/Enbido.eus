import React, { useState, useEffect } from 'react';
import type { TournamentFormState, TournamentDto } from '../../types/tournament';
import { CONST_VIEW_LIST, CONST_VIEW_PUBLISH } from './constants';
import api from '../../services/api';

import TournamentList from './components/TournamentList';
import PublishForm from './components/PublishForm';
import './tournament.css';

const TournamentPage = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tournaments');
        const mapped = res.data.map((t: any) => ({
          id: t.tournamentId,
          tournamentName: t.title,
          contactEmail: t.organizer?.email || 'harreman@mus.eus',
          tournamentLocation: t.specificLocation + (t.city ? `, ${t.city}` : ''),
          tournamentStructure: 'professional',
          tournamentDate: t.startDatetime ? t.startDatetime.split('T')[0] : '',
          tournamentTime: t.startDatetime ? t.startDatetime.split('T')[1]?.substring(0, 5) : '',
          maxParticipants: String(t.maxTeams || 64),
          inscriptionPrice: String(t.entryFee || 0),
          tournamentPrizes: '1º: Txapela + Saria, 2º: Saria',
          otherDetails: t.status === 'open' ? 'Inscripciones abiertas' : t.status,
          posterImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
        }));
        setTournamentsList(mapped);
      } catch (err) {
        console.error('Error fetching tournaments from DB:', err);
      } finally {
        setLoading(false);
      }
    };
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
        maxTeams: Number(newTournamentData.maxParticipants || 32),
        status: 'open'
      };

      const res = await api.post('/tournaments', payload);
      const saved = res.data;
      
      const newTournament: TournamentDto = {
        id: saved.tournamentId,
        tournamentName: saved.title,
        contactEmail: saved.organizer?.email || newTournamentData.contactEmail || 'harreman@mus.eus',
        tournamentLocation: saved.specificLocation + (saved.city ? `, ${saved.city}` : ''),
        tournamentStructure: newTournamentData.tournamentStructure || 'association',
        tournamentDate: saved.startDatetime ? saved.startDatetime.split('T')[0] : newTournamentData.tournamentDate,
        tournamentTime: saved.startDatetime ? saved.startDatetime.split('T')[1]?.substring(0, 5) : newTournamentData.tournamentTime,
        maxParticipants: String(saved.maxTeams || newTournamentData.maxParticipants),
        inscriptionPrice: String(saved.entryFee || newTournamentData.inscriptionPrice),
        tournamentPrizes: newTournamentData.tournamentPrizes || 'Txapela + Saria',
        otherDetails: newTournamentData.otherDetails || 'Publicado con éxito',
        posterImage: newTournamentData.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
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
          <div style={{ color: '#fff', textAlign: 'center', marginTop: '40px' }}>Kargatzen / Cargando...</div>
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