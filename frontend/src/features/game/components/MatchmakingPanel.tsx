import React from 'react';
import { useTranslation } from 'react-i18next';

interface MatchmakingPanelProps {
  isSearching: boolean;
  queueSize: number;
  selectedReyes: '4' | '8';
  onSelectReyes: (reyes: '4' | '8') => void;
  onStartMatchmaking: (reyes: '4' | '8') => void;
  onCancelMatchmaking: () => void;
}

const MatchmakingPanel: React.FC<MatchmakingPanelProps> = ({
  isSearching,
  queueSize,
  selectedReyes,
  onSelectReyes,
  onStartMatchmaking,
  onCancelMatchmaking,
}) => {
  const { t } = useTranslation();

  return (
    <section className="lobby-column matchmaking-panel">
      <div className="panel-glow-header">
        <span className="panel-icon">⚡</span>
        <h2>{t('premiumLobby.matchFinder')}</h2>
      </div>
      <p className="panel-desc">{t('premiumLobby.matchFinderDesc')}</p>

      {isSearching ? (
        <div className="search-spinner-area">
          <div className="lobby-loader"></div>
          <p className="searching-lbl">{t('premiumLobby.searchingOpponents')}</p>
          {queueSize > 0 && <p className="queue-size-lbl">{t('premiumLobby.queueSize', { count: queueSize })}</p>}
          <button className="cancel-search-btn" onClick={onCancelMatchmaking}>
            {t('premiumLobby.cancelSearch')}
          </button>
        </div>
      ) : (
        <>
          <div className="reyes-selector">
            <label className="reyes-selector-label">{t('premiumLobby.kingsRules')}</label>
            <div className="reyes-selector-options">
              <button
                type="button"
                onClick={() => onSelectReyes('8')}
                className={`reyes-option ${selectedReyes === '8'
                  ? 'reyes-option--active'
                  : 'reyes-option--inactive'
                  }`}
              >
                {t('lobby.kings8')}
              </button>
              <button
                type="button"
                onClick={() => onSelectReyes('4')}
                className={`reyes-option ${selectedReyes === '4'
                  ? 'reyes-option--active'
                  : 'reyes-option--inactive'
                  }`}
              >
                {t('lobby.kings4')}
              </button>
            </div>
          </div>
          <button className="join-queue-btn" onClick={() => onStartMatchmaking(selectedReyes)}>
            {t('premiumLobby.searchMatch')}
          </button>
        </>
      )}
    </section>
  );
};

export default MatchmakingPanel;
