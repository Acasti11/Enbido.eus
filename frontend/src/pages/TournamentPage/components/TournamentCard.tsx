import React from 'react';
import type { TournamentDto } from '../../../types/tournament';

interface TournamentCardProps {
  tournamentData: TournamentDto;
}

const TournamentCard = ({ tournamentData }: TournamentCardProps): React.JSX.Element => {
  return (
    <article className="tournament-card">
      <div className="card-content">
        <h3 className="card-title">{tournamentData.tournamentName}</h3>
        <p>📍 {tournamentData.tournamentLocation}</p>
        <p>🗓️ {tournamentData.tournamentDate} - {tournamentData.tournamentTime}</p>
      </div>
    </article>
  );
};

export default TournamentCard;