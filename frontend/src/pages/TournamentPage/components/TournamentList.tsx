import React from 'react';
import type { TournamentDto } from '../../../types/tournament';
import TournamentCard from './TournamentCard';
import { useTranslation } from 'react-i18next';

interface TournamentListProps {
  tournaments: TournamentDto[];
  onPublish?: () => void;
  onClickDetail: (id: number) => void;
}

const TournamentList = ({ tournaments, onPublish, onClickDetail }: TournamentListProps): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('tournament.title')}</h1>
        <button className="btn-action" onClick={onPublish}>{t('tournament.publish')}</button>
      </header>
      <section className="tournament-grid">
        {tournaments.length === 0 ? (
          <p className="empty-msg">{t('tournament.empty')}</p>
        ) : (
          tournaments.map((t) => (
            <TournamentCard key={t.id} tournamentData={t} onClickDetail={onClickDetail} />
          ))
        )}
      </section>
    </div>
  );
};

export default TournamentList;