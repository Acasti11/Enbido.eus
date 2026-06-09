import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Friend } from '@/features/game/domain/lobby.types';

interface ProfilePreviewModalProps {
  user: Friend | null;
  onClose: () => void;
}

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({ user, onClose }) => {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <div className="profile-card-modal" onClick={onClose}>
      <div className="profile-card-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-card-avatar">
          🏆
        </div>
        <h3 className="profile-card-username">{user.username}</h3>
        <span className="profile-card-rank">
          {user.elo >= 1500 ? t('premiumLobby.rankEnbidoMaisu') : user.elo >= 1200 ? t('premiumLobby.rankExpert') : t('premiumLobby.rankBeginner')}
        </span>

        <div className="profile-card-details-grid">
          <div className="profile-detail-box">
            <span className="profile-detail-lbl">{t('premiumLobby.eloPoints')}</span>
            <span className="profile-detail-val">{user.elo}</span>
          </div>
          <div className="profile-detail-box">
            <span className="profile-detail-lbl">{t('premiumLobby.effectiveness')}</span>
            <span className="profile-detail-val">
              {user.totalGamesPlayed > 0
                ? Math.round((user.totalGamesWon / user.totalGamesPlayed) * 100)
                : 0}%
            </span>
          </div>
          <div className="profile-detail-box">
            <span className="profile-detail-lbl">{t('premiumLobby.played')}</span>
            <span className="profile-detail-val">{user.totalGamesPlayed}</span>
          </div>
          <div className="profile-detail-box">
            <span className="profile-detail-lbl">{t('premiumLobby.won')}</span>
            <span className="profile-detail-val">{user.totalGamesWon}</span>
          </div>
        </div>

        <button
          className="profile-card-close-btn"
          onClick={onClose}
        >
          {t('premiumLobby.closeProfile')}
        </button>
      </div>
    </div>
  );
};

export default ProfilePreviewModal;
