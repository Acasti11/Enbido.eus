import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TournamentBackendDto } from '@/features/game/domain/lobby.types';

interface TournamentSectionProps {
  onlineTournaments: TournamentBackendDto[];
  loadingTournaments: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
  onOpenDetail: (id: number) => void;
  onOpenCreateModal: () => void;
}

const TournamentSection: React.FC<TournamentSectionProps> = ({
  onlineTournaments,
  loadingTournaments,
  isAdmin,
  onRefresh,
  onOpenDetail,
  onOpenCreateModal,
}) => {
  const { t } = useTranslation();

  return (
    <div className="tournaments-section">
      <div className="tournaments-header">
        <div>
          <h2 className="tournaments-title">{t('premiumLobby.tournamentsTitle')}</h2>
          <p className="tournaments-subtitle">
            {t('premiumLobby.tournamentsDesc')}
          </p>
        </div>
        <div className="tournaments-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={onOpenCreateModal}
              className="btn-action tournaments-create-btn"
              style={{ background: 'var(--color-gold)', color: '#000', fontWeight: 'bold' }}
            >
              {t('premiumLobby.createTournament')}
            </button>
          )}
          <button
            onClick={onRefresh}
            className="btn-action tournaments-refresh-btn"
          >
            {t('premiumLobby.updateList')}
          </button>
        </div>
      </div>

      {loadingTournaments ? (
        <div className="tournaments-loading">
          <div className="lobby-loader"></div>
          <p className="tournaments-loading-text">{t('premiumLobby.loadingTournaments')}</p>
        </div>
      ) : onlineTournaments.length === 0 ? (
        <div className="tournaments-empty">
          <span className="tournaments-empty-icon">🎫</span>
          <h3 className="tournaments-empty-title">{t('premiumLobby.noTournaments')}</h3>
          <p className="tournaments-empty-text">
            {t('premiumLobby.noTournamentsDesc')}
          </p>
        </div>
      ) : (
        <div className="tournaments-grid">
          {onlineTournaments.map((tourney) => {
            const isPlaying = tourney.status === 'playing';
            const isFinished = tourney.status === 'finished';
            return (
              <div
                key={tourney.id || tourney.tournamentId}
                onClick={() => onOpenDetail(tourney.id || tourney.tournamentId)}
                className="lobby-column tourney-card"
              >
                <div className="tourney-card-header">
                  <span className={`tourney-card-status ${isPlaying ? 'tourney-card-status--playing' : isFinished ? 'tourney-card-status--finished' : 'tourney-card-status--open'}`}>
                    {isPlaying ? t('premiumLobby.inGame') : isFinished ? t('premiumLobby.finished') : t('premiumLobby.open')}
                  </span>
                  <span className="tourney-card-platform">{t('premiumLobby.onlineLabel')}</span>
                </div>

                <h3 className="tourney-card-title">
                  {tourney.title || tourney.tournamentName}
                </h3>

                <div className="tourney-card-info">
                  <div>📍 <strong>{t('premiumLobby.server')}</strong> Enbido.eus Online</div>
                  <div>🗓️ <strong>{t('premiumLobby.date')}</strong> {(() => {
                    if (!tourney.startDatetime) return t('tournament.determineLater');
                    const isoString = tourney.startDatetime.endsWith('Z') ? tourney.startDatetime : tourney.startDatetime + 'Z';
                    const dateObj = new Date(isoString);
                    if (isNaN(dateObj.getTime())) return tourney.startDatetime.replace('T', ' ').substring(0, 16);
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}`;
                  })()}</div>
                </div>

                <div className="tourney-card-prizes">
                  <div className="tourney-prize-col">
                    <span className="tourney-prize-label">{t('premiumLobby.entry')}</span>
                    <span className="tourney-prize-val tourney-prize-val--entry">💰 {tourney.coinsFee || 0} tx</span>
                  </div>
                  <div className="tourney-prize-col">
                    <span className="tourney-prize-label">{t('premiumLobby.prize')}</span>
                    <span className="tourney-prize-val tourney-prize-val--reward">🏆 {tourney.coinsReward || 0} tx</span>
                  </div>
                </div>

                <button
                  className="btn-action tourney-card-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(tourney.id || tourney.tournamentId);
                  }}
                >
                  {isFinished ? t('premiumLobby.viewChampionBrackets') : t('premiumLobby.viewBracketsRegister')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentSection;
