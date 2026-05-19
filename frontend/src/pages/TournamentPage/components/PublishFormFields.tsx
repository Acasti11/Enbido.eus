import React, { useState } from 'react';
import type { TournamentFormState, TournamentDto } from '../../types/tournament';
import { CONST_VIEW_LIST, CONST_VIEW_PUBLISH, CONST_INITIAL_TOURNAMENTS } from './constants';

import TournamentList from './components/TournamentList';
import PublishForm from './components/PublishForm';
import './tournament.css';

const TournamentPage = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>(CONST_INITIAL_TOURNAMENTS);

  const isListView = currentView === CONST_VIEW_LIST;
  const isPublishView = currentView === CONST_VIEW_PUBLISH;

  const handleShowList = () => setCurrentView(CONST_VIEW_LIST);
  const handleShowPublish = () => setCurrentView(CONST_VIEW_PUBLISH);

  const handleSaveTournament = (newTournamentData: TournamentFormState) => {
    const newTournament: TournamentDto = { ...newTournamentData, id: Date.now() };
    setTournamentsList((prevList) => [newTournament, ...prevList]);
    handleShowList();
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

export default TournamentPage;