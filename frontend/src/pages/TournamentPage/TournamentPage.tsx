import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { TournamentFormState, TournamentDto } from '../../types/tournament';
import { CONST_VIEW_LIST, CONST_VIEW_PUBLISH, CONST_INITIAL_TOURNAMENTS } from './constants';

// Importaciones estándar (sin llaves y sin asteriscos)
import TournamentList from './components/TournamentList';
import PublishForm from './components/PublishForm';
import './tournament.css';

const TournamentPage = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>(CONST_INITIAL_TOURNAMENTS);

  const isListView = currentView === CONST_VIEW_LIST;
  const isPublishView = currentView === CONST_VIEW_PUBLISH;

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments');
      // Mapear los datos del backend al formato que esperan los componentes antiguos
      const mappedTournaments = response.data.map((t: any) => ({
        ...t,
        id: t.tournamentId,
        tournamentName: t.title,
        tournamentLocation: t.city + (t.specificLocation ? ' - ' + t.specificLocation : ''),
        tournamentDate: t.startDatetime ? t.startDatetime.split('T')[0] : '',
        tournamentTime: t.startDatetime ? t.startDatetime.split('T')[1]?.substring(0,5) : '',
        maxParticipants: t.maxTeams,
        inscriptionPrice: t.entryFee
      }));
      setTournamentsList(mappedTournaments);
    } catch (error) {
      console.error('Error fetching tournaments', error);
    }
  };

  const handleShowList = () => setCurrentView(CONST_VIEW_LIST);
  const handleShowPublish = () => setCurrentView(CONST_VIEW_PUBLISH);

  const handleSaveTournament = async (newTournamentData: TournamentFormState) => {
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).userId : 1;

    try {
      // Mapear los datos del formulario antiguo al formato que espera el nuevo backend
      await api.post('/tournaments', {
        title: newTournamentData.tournamentName,
        city: newTournamentData.tournamentLocation,
        specificLocation: newTournamentData.tournamentLocation,
        startDatetime: `${newTournamentData.tournamentDate}T${newTournamentData.tournamentTime}:00`,
        entryFee: parseInt(newTournamentData.inscriptionPrice || '0', 10),
        maxTeams: parseInt(newTournamentData.maxParticipants || '8', 10),
        organizerId: userId
      });
      await fetchTournaments();
      setCurrentView(CONST_VIEW_LIST);
    } catch (error) {
      console.error('Error creating tournament', error);
    }
  };

  return (
    <div className="tournament-app-wrapper">
      <nav className="tournament-nav-bar">
        <div className="tournament-nav-brand" onClick={handleShowList}>
          <div className="tournament-nav-avatar">♣</div>
          <span className="tournament-nav-title">MUS PLATFORM</span>
        </div>
        <div className="tournament-nav-user">
          <span onClick={handleShowList} style={{ cursor: 'pointer' }}>Inicio</span>
          <div className="tournament-nav-avatar">MP</div>
        </div>
      </nav>

      <main className="page-content">
        {isListView && (
          <header className="page-header">
            <div>
              <h1 className="page-title">Txapelketak / Tournois</h1>
              <p className="page-subtitle">Encuentra y apúntate a los próximos torneos de mus</p>
            </div>
            <button className="btn-action" onClick={handleShowPublish}>
              + Argitaratu
            </button>
          </header>
        )}

        {isPublishView && (
          <header className="page-header">
            <div>
              <h1 className="page-title">Zure txapelketa hemen argitaratu!</h1>
              <p className="page-subtitle">Publie ton tournois ici! ¡Publica tu torneo aquí!</p>
            </div>
            <button className="btn-back" onClick={handleShowList}>
              ← Itzuli / Volver
            </button>
          </header>
        )}

        {isListView && <TournamentList tournaments={tournamentsList} />}
        {isPublishView && <PublishForm onAddTournament={handleSaveTournament} onCancelPublish={handleShowList} />}
      </main>
    </div>
  );
};

// 2. EXPORTACIÓN POR DEFECTO para que App.tsx no dé error
export default TournamentPage;