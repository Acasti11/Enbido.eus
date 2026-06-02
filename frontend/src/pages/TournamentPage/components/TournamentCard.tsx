import React from 'react';
import type { TournamentDto } from '../../../types/tournament';
import { useTranslation } from 'react-i18next';

interface TournamentCardProps {
  tournamentData: TournamentDto;
  onClickDetail: (id: number) => void;
}

const TournamentCard = ({ tournamentData, onClickDetail }: TournamentCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <article className="tournament-card" onClick={() => onClickDetail(tournamentData.id)}>
      <div className="card-poster">
        <img
          src={tournamentData.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'}
          alt={tournamentData.tournamentName}
          className="card-poster-img"
        />
        <div className="card-poster-overlay">
          <span>{t('tournamentSheet')}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header tournament-card-header">
          <span className="card-tag tournament-card-tag">
            {t('inPerson')}
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
          {t('seeMore')}
        </button>
      </div>
    </article>
  );
};

export default TournamentCard;