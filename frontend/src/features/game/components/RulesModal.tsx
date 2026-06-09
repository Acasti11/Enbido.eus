import React from 'react';
import { useTranslation } from 'react-i18next';

interface RulesModalProps {
  show: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ show, onClose }) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="leaderboard-modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal leaderboard-modal--rules" onClick={(e) => e.stopPropagation()}>
        <header className="leaderboard-modal-header">
          <div className="leaderboard-title-group">
            <span className="leaderboard-header-icon">🃏</span>
            <div>
              <h2 className="leaderboard-modal-title">{t('premiumLobby.rulesTitle')}</h2>
              <span className="leaderboard-modal-subtitle">{t('premiumLobby.rulesSubtitle')}</span>
            </div>
          </div>
          <button className="leaderboard-close-x" onClick={onClose}>
            &times;
          </button>
        </header>

        <div className="rules-modal-body">
          {/* What is Mus */}
          <div className="rules-section">
            <h3 className="rules-section-title">
              <span>🃏</span> {t('premiumLobby.rulesWhatIsMus')}
            </h3>
            <p className="rules-text">
              {t('premiumLobby.whatIsMusAnswer')}
            </p>
            <p className="rules-note">
              {t('premiumLobby.musNote')}
            </p>
          </div>

          {/* The 4 rounds */}
          <div className="rules-section">
            <h3 className="rules-section-title">
              <span>⚔️</span> {t('premiumLobby.rules4Lances')}
            </h3>
            <p className="rules-text">
              {t('rules.lancesIntro')}
            </p>
            <div className="rules-grid-2col">
              <div className="rules-card">
                <h4 className="rules-card-title">{t('premiumLobby.grandeCardTitle')}</h4>
                <p className="rules-card-text">
                  {t('premiumLobby.grandeCardText')}
                </p>
              </div>
              <div className="rules-card">
                <h4 className="rules-card-title">{t('premiumLobby.chicaCardTitle')}</h4>
                <p className="rules-card-text">
                  {t('premiumLobby.chicaCardText')}
                </p>
              </div>
              <div className="rules-card">
                <h4 className="rules-card-title">{t('premiumLobby.paresCardTitle')}</h4>
                <p className="rules-card-text">
                  {t('premiumLobby.paresCardText')}
                </p>
              </div>
              <div className="rules-card">
                <h4 className="rules-card-title">{t('premiumLobby.juegoCardTitle')}</h4>
                <p className="rules-card-text">
                  {t('premiumLobby.juegoCardText')}
                </p>
              </div>
            </div>
          </div>

          {/* Signs */}
          <div className="rules-section">
            <h3 className="rules-section-title">
              <span>🤫</span> {t('premiumLobby.rulesSignsGuide')}
            </h3>
            <div className="rules-guide-grid">
              {[
                { emoji: '👄', nameKey: 'premiumLobby.biteLowerLip', meaningKey: 'premiumLobby.signMeaningReyes' },
                { emoji: '👅', nameKey: 'premiumLobby.tongueTip', meaningKey: 'premiumLobby.signMeaningAses' },
                { emoji: '😉', nameKey: 'premiumLobby.winkEye', meaningKey: 'premiumLobby.signMeaningMedias' },
                { emoji: '🤨', nameKey: 'premiumLobby.raiseEyebrows', meaningKey: 'premiumLobby.signMeaningDuples' },
                { emoji: '🤫', nameKey: 'premiumLobby.tiltHead', meaningKey: 'premiumLobby.signMeaning31' },
                { emoji: '😑', nameKey: 'premiumLobby.closeEyes', meaningKey: 'premiumLobby.signMeaningCiego' }
              ].map((s, i) => (
                <div key={i} className="rules-guide-item">
                  <span className="rules-guide-emoji">{s.emoji}</span>
                  <div>
                    <div className="rules-guide-name">{t(s.nameKey)}</div>
                    <div className="rules-guide-meaning">{t(s.meaningKey)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="rules-section">
            <h3 className="rules-section-title">
              <span>⚙️</span> {t('premiumLobby.rulesVariants')}
            </h3>
            <div className="rules-variants-list">
              <div className="rules-variant-card rules-variant-card--standard">
                <strong className="rules-variant-title">{t('premiumLobby.rules8ReyesTitle')}</strong>
                <p className="rules-variant-text">
                  {t('premiumLobby.rules8ReyesDesc')}
                </p>
              </div>
              <div className="rules-variant-card rules-variant-card--classic">
                <strong className="rules-variant-title">{t('premiumLobby.rules4ReyesTitle')}</strong>
                <p className="rules-variant-text">
                  {t('premiumLobby.rules4ReyesDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
