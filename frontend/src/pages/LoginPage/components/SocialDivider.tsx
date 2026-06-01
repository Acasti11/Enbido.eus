import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/social-divider.css';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const SocialDivider: React.FC<LoginFormProps> = ({ onSwitchToRegister }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="social-divider">
      <div className="social-divider__row">
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
