import React from 'react';
import type { TournamentDto } from '../../../types/tournament';

interface TournamentCardProps {
  tournamentData: TournamentDto;
  onClickDetail: (id: number) => void;
}

const TournamentCard = ({ tournamentData, onClickDetail }: TournamentCardProps): React.JSX.Element => {
  const isPlaying = tournamentData.status === 'playing';
  const isFinished = tournamentData.status === 'finished';
  
  return (
    <article className="tournament-card" onClick={() => onClickDetail(tournamentData.id)} style={{ cursor: 'pointer' }}>
      <div className="card-poster">
        <img 
          src={tournamentData.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'} 
          alt={tournamentData.tournamentName} 
          className="card-poster-img"
        />
        <div className="card-poster-overlay">
          <span>Ver Eliminatorias / Brackets</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header" style={{ marginBottom: '10px', paddingBottom: '10px' }}>
          <span className={`card-tag ${isPlaying ? 'tag-playing' : isFinished ? 'tag-finished' : ''}`} style={{ marginBottom: '6px' }}>
            {isPlaying ? '⚡ En juego' : isFinished ? '🏆 Finalizado' : '📝 Abierto'}
          </span>
          <h3 className="card-title" style={{ margin: '4px 0 0 0', fontSize: '1.2rem' }}>{tournamentData.tournamentName}</h3>
        </div>
        
        <div className="card-body" style={{ gap: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
          <p style={{ margin: 0 }}>📍 <strong>Ubicación:</strong> {tournamentData.tournamentLocation}</p>
          <p style={{ margin: 0 }}>🗓️ <strong>Fecha:</strong> {tournamentData.tournamentDate} a las {tournamentData.tournamentTime}</p>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>INSCRIPCIÓN</span>
              <span style={{ color: '#fac715', fontWeight: 'bold', fontSize: '0.95rem' }}>
                💰 {tournamentData.coinsFee || '0'} tx
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>PREMIO</span>
              <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.95rem' }}>
                🏆 {tournamentData.coinsReward || '0'} tx
              </span>
            </div>
          </div>
        </div>
        
        <button 
          className="btn-action" 
          onClick={(e) => {
            e.stopPropagation();
            onClickDetail(tournamentData.id);
          }}
          style={{ width: '100%', marginTop: '10px', padding: '10px 0', fontSize: '0.85rem' }}
        >
          {isFinished ? 'Ver Campeón y Llaves' : 'Ver Brackets / Inscripción'}
        </button>
      </div>
    </article>
  );
};

export default TournamentCard;