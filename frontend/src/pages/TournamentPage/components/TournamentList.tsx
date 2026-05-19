import React from 'react';
import type { TournamentDto } from '../../../types/tournament';
import TournamentCard from './TournamentCard';

interface TournamentListProps {
  tournaments: TournamentDto[];
  onPublish?: () => void;
}

const TournamentList = ({ tournaments, onPublish }: TournamentListProps): React.JSX.Element => {
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Txapelketak / Tournois</h1>
        <button className="btn-action" onClick={onPublish}>+ Argitaratu</button>
      </header>
      <section className="tournament-grid">
        {tournaments.length === 0 ? (
          <p className="empty-msg">Ez dago txapelketarik.</p>
        ) : (
          tournaments.map((t) => (
            <TournamentCard key={t.id} tournamentData={t} />
          ))
        )}
      </section>
    </div>
  );
};

export default TournamentList;