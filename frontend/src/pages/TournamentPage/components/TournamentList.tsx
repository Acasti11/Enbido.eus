import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TournamentDto } from '../../../types/tournament';
import TournamentCard from './TournamentCard';
import { useTranslation } from 'react-i18next';

interface TournamentListProps {
  tournaments: TournamentDto[];
  onPublish?: () => void;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
}

const TournamentList = ({ tournaments, onPublish, isAdmin, onDelete }: TournamentListProps): React.JSX.Element => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">{t('tournament.title')}</h1>
        <button className="btn-action" onClick={onPublish}>{t('tournament.publish')}</button>
      </header>

      {/* REDIRECTION BANNER TO PLAY TAB FOR BRACKETS */}
      <div 
        className="presencial-redirect-banner" 
        style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px'
        }}
      >
        <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 500 }}>
          {t('tournament.spanText')}
        </span>
        <button 
          className="btn-action" 
          onClick={() => navigate('/jugar')}
          style={{ padding: '8px 16px', fontSize: '0.85rem', boxShadow: 'none' }}
        >
          {t('tournament.virtualTournamentButton')}
        </button>
      </div>

      <section className="tournament-grid">
        {tournaments.length === 0 ? (
          <p className="empty-msg">{t('tournament.empty')}</p>
        ) : (
          tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournamentData={t}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          ))
        )}
      </section>
    </div>
  );
};

export default TournamentList;