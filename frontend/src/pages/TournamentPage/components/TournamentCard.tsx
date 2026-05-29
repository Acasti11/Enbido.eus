import React from 'react';
import type { TournamentDto } from '../../../types/tournament';

interface TournamentCardProps {
  tournamentData: TournamentDto;
  onClickDetail: (id: number) => void;
}

const TournamentCard = ({ tournamentData, onClickDetail }: TournamentCardProps): React.JSX.Element => {
  return (
    <article className="tournament-card" onClick={() => onClickDetail(tournamentData.id)} style={{ cursor: 'pointer' }}>
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
        <div className="card-header" style={{ marginBottom: '10px', paddingBottom: '10px' }}>
          <span className="card-tag" style={{ marginBottom: '6px' }}>
            📍 Presencial
          </span>
          <h3 className="card-title" style={{ margin: '4px 0 0 0', fontSize: '1.2rem' }}>{tournamentData.tournamentName}</h3>
        </div>
        
        <div className="card-body" style={{ gap: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
          <p style={{ margin: 0 }}>📍 <strong>Ubicación:</strong> {tournamentData.tournamentLocation}</p>
          <p style={{ margin: 0 }}>🗓️ <strong>Fecha:</strong> {tournamentData.tournamentDate} a las {tournamentData.tournamentTime}</p>
          {tournamentData.contactEmail && (
            <p style={{ margin: 0 }}>✉️ <strong>Contacto:</strong> {tournamentData.contactEmail}</p>
          )}
        </div>
        
        <button 
          className="btn-action" 
          onClick={(e) => {
            e.stopPropagation();
            onClickDetail(tournamentData.id);
          }}
          style={{ width: '100%', marginTop: '20px', padding: '10px 0', fontSize: '0.85rem' }}
        >
          Ver Más Detalles
        </button>
      </div>
    </article>
  );
};

export default TournamentCard;