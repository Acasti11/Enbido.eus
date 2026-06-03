import React from 'react';
import { useTranslation } from 'react-i18next';
import GoogleLoginButton from './GoogleLoginButton';
import '../styles/social-divider.css';

interface SocialDividerProps {
  onSwitchToRegister: () => void;
}

const SocialDivider: React.FC<SocialDividerProps> = ({ onSwitchToRegister }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="social-divider">
      <div className="social-divider__row">
        <div className="social-divider__line" />
        <span className="social-divider__text">{t('login.or')}</span>
        <div className="social-divider__line" />
      </div>

      <GoogleLoginButton />

      <div className="social-divider__row" style={{ marginTop: '16px' }}>
        <div className="social-divider__line" />
        <span className="social-divider__text">{t('login.newPlayer')}</span>
        <div className="social-divider__line" />
      </div>
      <button type="button" className="social-divider__register" onClick={onSwitchToRegister}>
        {t('login.createFreeAccount')}
      </button>
    </div>
  );
};

export default SocialDivider;
