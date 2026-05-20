import React, { useState } from 'react';
import type { TournamentFormState, TournamentDto } from '../../types/tournament';
import { CONST_VIEW_LIST, CONST_VIEW_PUBLISH, CONST_INITIAL_TOURNAMENTS } from './constants';

import TournamentList from './components/TournamentList';
import PublishForm from './components/PublishForm';
import './tournament.css';

const TournamentPage = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>(CONST_INITIAL_TOURNAMENTS);

  const handleSaveTournament = (newTournamentData: TournamentFormState) => {
    const newTournament: TournamentDto = { ...newTournamentData, id: Date.now() };
    setTournamentsList((prevList) => [newTournament, ...prevList]);
    setCurrentView(CONST_VIEW_LIST);
  };

  return (
    <div className="tournament-app-wrapper">
      <nav className="tournament-nav-bar">
        <div className="tournament-nav-brand" onClick={() => setCurrentView(CONST_VIEW_LIST)}>
          <span className="tournament-nav-title">MUS PLATFORM</span>
        </div>
      </nav>

      <main className="page-content">
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
      </main>
    </div>
  );
};

export default TournamentPage;