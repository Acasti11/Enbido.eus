import React from 'react';
import type { TournamentDto } from '../../../types/tournament';
import { useTranslation } from 'react-i18next';

interface TournamentCardProps {
  tournamentData: TournamentDto;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
}

const TournamentCard = ({ tournamentData, isAdmin, onDelete }: TournamentCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const isOnline = tournamentData.type === 'ONLINE';

  return (
    <article className="tournament-card">
      <div className="card-poster">
        <img
          src={tournamentData.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'}
          alt={tournamentData.tournamentName}
          className="card-poster-img"
        />
      </div>
      <div className="card-content">
        <div className="card-header tournament-card-header">
          <span className={`card-tag tournament-card-tag ${isOnline ? 'badge-online' : 'badge-presencial'}`}>
            {isOnline ? '🌐 Online' : t('tournament.inPerson')}
          </span>
          <h2 className="card-title tournament-card-title">{tournamentData.tournamentName}</h2>
        </div>

        <div className="card-body tournament-card-body">
          <p className="tournament-card-body-text">
            <strong>{t('tournament.location')}</strong> {tournamentData.tournamentLocation}
          </p>          <p className="tournament-card-body-text">
            <strong>{t('tournament.dateDetail')}</strong> {tournamentData.tournamentDate} {t('tournament.atTime')} {tournamentData.tournamentTime}
          </p>          {tournamentData.contactEmail && (
            <p className="tournament-card-body-text">
              <strong>{t('tournament.contactDetail')}</strong> {tournamentData.contactEmail}
            </p>)}

          {isAdmin && isOnline && onDelete && (
            <div className="tournament-card-actions" style={{ marginTop: '12px' }}>
              <button
                className="btn-delete"
                onClick={() => onDelete(tournamentData.id)}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                🗑️ {t('tournament.delete') || 'Borrar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default TournamentCard;