import React from 'react';
import type { TournamentDto } from '../../../types/tournament';
import { useTranslation } from 'react-i18next';

interface TournamentCardProps {
  tournamentData: TournamentDto;
}

const TournamentCard = ({ tournamentData }: TournamentCardProps): React.JSX.Element => {
  const { t } = useTranslation();
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
          <span className="card-tag tournament-card-tag">
            {t('tournament.inPerson')}
          </span>
          <h3 className="card-title tournament-card-title">{tournamentData.tournamentName}</h3>
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

        </div>
      </div>
    </article>
  );
};

export default TournamentCard;