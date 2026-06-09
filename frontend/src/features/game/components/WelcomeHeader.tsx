import React from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfile } from '@/features/game/domain/lobby.types';

interface WelcomeHeaderProps {
  activeUsername: string;
  loading: boolean;
  profile: UserProfile | null;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  activeUsername,
  loading,
  profile,
  onOpenLeaderboard,
  onOpenRules,
}) => {
  const { t } = useTranslation();

  return (
    <header className="lobby-header">
      <div className="welcome-section">
        <span className="welcome-tag">{t('premiumLobby.registeredPlayer')}</span>
        <h1 className="welcome-title">{t('premiumLobby.hello', { username: activeUsername })}</h1>
      </div>

      {/* USER STATS BADGES */}
      {!loading && profile && (
        <div className="header-badges">
          <div className="lobby-badge elo-badge">
            <span className="badge-icon">📊</span>
            <div className="badge-details">
              <span className="badge-val">{profile.elo} ELO</span>
              <span className="badge-lbl">{t('premiumLobby.rankPoints')}</span>
            </div>
          </div>
          <div className="lobby-badge coins-badge">
            <span className="badge-icon">💰</span>
            <div className="badge-details">
              <span className="badge-val">{profile.coins}</span>
              <span className="badge-lbl">{t('premiumLobby.goldCoins')}</span>
            </div>
          </div>
          <button
            className="lobby-badge leaderboard-trigger-btn"
            onClick={onOpenLeaderboard}
            title={t("premiumLobby.viewRanking")}
          >
            <span className="badge-icon">🏆</span>
            <div className="badge-details">
              <span className="badge-val">{t('premiumLobby.viewRanking')}</span>
              <span className="badge-lbl">{t('premiumLobby.ranking')}</span>
            </div>
          </button>
          <button
            className="lobby-badge rules-trigger-btn"
            onClick={onOpenRules}
            title={t("premiumLobby.gameGuide")}
          >
            <span className="badge-icon">🃏</span>
            <div className="badge-details">
              <span className="badge-val">{t('premiumLobby.rulesKeinus')}</span>
              <span className="badge-lbl">{t('premiumLobby.gameGuide')}</span>
            </div>
          </button>
        </div>
      )}
    </header>
  );
};

export default WelcomeHeader;
