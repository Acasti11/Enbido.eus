import React from 'react';
import type { TournamentDto } from '../../../types/tournament';

interface TournamentCardProps {
  tournamentData: TournamentDto;
  onClickDetail: (id: number) => void;
}

const TournamentCard = ({ tournamentData, onClickDetail }: TournamentCardProps): React.JSX.Element => {
  return (
    <article className="tournament-card" onClick={() => onClickDetail(tournamentData.id)}>
      <div className="card-poster">
        <img
          src={tournamentData.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'}
          alt={tournamentData.tournamentName}
          className="card-poster-img"
        />
        <div className="card-poster-overlay">
          <span>Ver Información / Detalles</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header tournament-card-header">
          <span className="card-tag tournament-card-tag">
            📍 Presencial
          </span>
          <h3 className="card-title tournament-card-title">{tournamentData.tournamentName}</h3>
        </div>

        <div className="card-body tournament-card-body">
          <p className="tournament-card-body-text">📍 <strong>Ubicación:</strong> {tournamentData.tournamentLocation}</p>
          <p className="tournament-card-body-text">🗓️ <strong>Fecha:</strong> {tournamentData.tournamentDate} a las {tournamentData.tournamentTime}</p>
          {tournamentData.contactEmail && (
            <p className="tournament-card-body-text">✉️ <strong>Contacto:</strong> {tournamentData.contactEmail}</p>
          )}
        </div>

        <button
          className="btn-action tournament-card-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClickDetail(tournamentData.id);
          }}
        >
          Ver Más Detalles
        </button>
      </div>
    </article>
  );
};

export default TournamentCard;