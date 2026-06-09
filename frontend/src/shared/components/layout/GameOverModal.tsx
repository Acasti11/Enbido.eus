import React from 'react';
import { useTranslation } from 'react-i18next';
import './game-over-modal.css';

interface PlayerProfile {
  userId: number;
  elo: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}

interface SeatInfo {
  chair: number;
  username: string;
  isBot: boolean;
  userId: number | null;
}

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  roundsWonUs: number;
  roundsWonThem: number;
  maxRounds: number;
  scoreUs: number;
  scoreThem: number;
  seats: SeatInfo[];
  eloChange: number | null;
  coinsChange?: number | null;
  winningProfiles: { [userId: number]: PlayerProfile };
  isLoading?: boolean;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  onLeave,
  roundsWonUs,
  roundsWonThem,
  maxRounds,
  scoreUs,
  scoreThem,
  seats,
  eloChange,
  coinsChange = null,
  winningProfiles,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Determine current player's team (Team 1 or Team 2)
  const myChair = seats[0]?.chair ?? 0;
  const isMyTeamUs = myChair % 2 === 0;

  // Determine winning couple
  const isUsWinner = roundsWonUs > roundsWonThem;
  const winningChairs = isUsWinner ? [0, 2] : [1, 3];
  
  // Determine if the current player won (conforming to is/has/should prefix rule)
  const isMyTeamWinner = isMyTeamUs ? isUsWinner : !isUsWinner;

  // Get winning players
  const winner1 = seats.find(s => s.chair === winningChairs[0]);
  const winner2 = seats.find(s => s.chair === winningChairs[1]);

  // Swap scores on pop-up scoreboard dynamically so left is always current player's team
  const leftRounds = isMyTeamUs ? roundsWonUs : roundsWonThem;
  const leftScore = isMyTeamUs ? scoreUs : scoreThem;
  const rightRounds = isMyTeamUs ? roundsWonThem : roundsWonUs;
  const rightScore = isMyTeamUs ? scoreThem : scoreUs;

  const renderWinnerCard = (player: SeatInfo | undefined) => {
    if (!player) return null;

    const profile = player.userId ? winningProfiles[player.userId] : null;
    const isBot = player.isBot;

    let avatarSkinClass = '';
    if (profile?.equippedAvatarItemId === 1) avatarSkinClass = 'avatar-ring-gold';
    else if (profile?.equippedAvatarItemId === 2) avatarSkinClass = 'avatar-ring-green';
    else if (profile?.equippedAvatarItemId === 7) avatarSkinClass = 'avatar-ring-ikurrina';
    else if (profile?.equippedAvatarItemId === 8) avatarSkinClass = 'avatar-ring-karta';

    const getTitleLabel = () => {
      if (isBot) return t('lobby.botComputer');
      if (profile?.equippedTitleItemId === 5) return t('musGame.titleHandia');
      if (profile?.equippedTitleItemId === 6) return t('musGame.titleEnbidoMaisu');
      return t('musGame.humanLabel');
    };

    return (
      <div className={`winner-profile-card ${isBot ? 'bot-card' : 'human-card'}`}>
        <div className="avatar-section">
          <div className={`modal-avatar-circle ${isBot ? 'bot-theme' : 'human-theme'} ${avatarSkinClass}`}>
            {isBot ? '🤖' : player.username.slice(0, 2).toUpperCase()}
          </div>
          <span className="card-badge">{isBot ? t('musGame.botLabel') : t('musGame.humanLabel')}</span>
        </div>
        <div className="details-section">
          <h3 className="winner-username">{player.username}</h3>
          <p className="winner-title">{getTitleLabel()}</p>
          {!isBot && profile && (
            <div className="winner-stats-row">
              <span className="winner-elo">🛡️ {profile.elo} ELO</span>
              <span className="winner-winrate">
                📈 {profile.totalGamesPlayed > 0 
                  ? Math.round((profile.totalGamesWon / profile.totalGamesPlayed) * 100) 
                  : 0}% WR
              </span>
            </div>
          )}
          {!isBot && !profile && isLoading && (
            <div className="winner-stats-row stats-loading">
              <span className="loading-placeholder animate-pulse">{t('common.loading')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ELO indicator section
  const renderEloSection = () => {
    if (isLoading) {
      return (
        <div className="elo-change-box elo-loading">
          <span className="elo-icon animate-spin">⏳</span>
          <span className="elo-text">{t('common.loading')}</span>
        </div>
      );
    }

    if (eloChange === null) {
      return (
        <div className="elo-change-box elo-neutral">
          <span className="elo-icon">🛡️</span>
          <span className="elo-text">{t('musGame.eloNoChange')}</span>
        </div>
      );
    }

    const isGained = eloChange > 0;
    const formattedElo = isGained ? `+${eloChange}` : eloChange;

    return (
      <div className={`elo-change-box ${isGained ? 'elo-gained' : 'elo-lost'}`}>
        <span className="elo-icon">{isGained ? '📈' : '📉'}</span>
        <span className="elo-text">
          {isGained 
            ? t('musGame.eloGained', { elo: formattedElo }) 
            : t('musGame.eloLost', { elo: Math.abs(eloChange) })}
        </span>
      </div>
    );
  };

  // Coins indicator section
  const renderCoinsSection = () => {
    if (isLoading) {
      return (
        <div className="elo-change-box elo-loading">
          <span className="elo-icon animate-spin">⏳</span>
          <span className="elo-text">{t('common.loading')}</span>
        </div>
      );
    }

    if (coinsChange === null) {
      return (
        <div className="elo-change-box elo-neutral">
          <span className="elo-icon">🪙</span>
          <span className="elo-text">{t('musGame.coinsNoChange')}</span>
        </div>
      );
    }

    const isGained = coinsChange > 0;
    const formattedCoins = isGained ? `+${coinsChange}` : coinsChange;

    return (
      <div className={`elo-change-box coins-change-box ${isGained ? 'elo-gained' : 'elo-lost'}`}>
        <span className="elo-icon">🪙</span>
        <span className="elo-text">
          {isGained 
            ? t('musGame.coinsGained', { coins: formattedCoins }) 
            : t('musGame.coinsLost', { coins: Math.abs(coinsChange) })}
        </span>
      </div>
    );
  };

  return (
    <div className="game-over-modal-overlay">
      <div className="game-over-modal-container animate-pop">
        <div className="modal-decorative-crown">👑</div>
        
        <header className={`modal-header-banner ${isMyTeamWinner ? 'banner-victory' : 'banner-defeat'}`}>
          <h2 className="banner-title">
            {isMyTeamWinner ? t('musGame.victory') : t('musGame.defeat')}
          </h2>
          <p className="banner-subtitle">{t('musGame.gameOver')}</p>
        </header>

        <div className="modal-content-body">
          {/* Match Score Summary */}
          <section className="score-summary-section">
            <div className="score-grid">
              <div className="score-team team-us">
                <span className="team-name">{t('musGame.teamUs')}</span>
                <span className="chicas-count">{leftRounds}</span>
                <span className="points-detail">({leftScore} {t('musGame.points')})</span>
              </div>
              <div className="score-separator">:</div>
              <div className="score-team team-them">
                <span className="team-name">{t('musGame.teamThem')}</span>
                <span className="chicas-count">{rightRounds}</span>
                <span className="points-detail">({rightScore} {t('musGame.points')})</span>
              </div>
            </div>
            <p className="match-rounds-rule">
              {t('musGame.bestOfRounds', { count: maxRounds * 2 - 1 })}
            </p>
          </section>

          {/* ELO and rewards change */}
          <section className="elo-section">
            {renderEloSection()}
            {renderCoinsSection()}
          </section>

          {/* Winning couple cards */}
          <section className="winners-section">
            <h4 className="section-title">{t('musGame.winnerTeam')}</h4>
            <div className="winners-cards-container">
              {renderWinnerCard(winner1)}
              {renderWinnerCard(winner2)}
            </div>
          </section>
        </div>

        <footer className="modal-actions-footer">
          <button 
            type="button" 
            className="btn-modal-action btn-primary-action" 
            onClick={onClose}
            id="btn-goback-waiting-room"
          >
            {t('musGame.backToLobby')}
          </button>
          <button 
            type="button" 
            className="btn-modal-action btn-secondary-action" 
            onClick={onLeave}
            id="btn-leave-to-main"
          >
            {t('musGame.leaveToMainMenu')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default GameOverModal;
