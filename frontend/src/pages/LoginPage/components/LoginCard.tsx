import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CardLogo from './CardLogo';
import LoginForm from './LoginForm';
import SocialDivider from './SocialDivider';
import '../styles/login-card.css';

interface LoginCardProps {
  onSwitchToRegister: () => void;
  onSwitchToRecover: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onSwitchToRegister, onSwitchToRecover }): React.JSX.Element => {
  const { t } = useTranslation();
  const [is2FaActive, setIs2FaActive] = useState(false);

  return (
    <div className="login-card">
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">{t('login.subtitle')}</p>
      </div>
      <LoginForm 
        onSwitchToRecover={onSwitchToRecover} 
        on2FaStatusChange={setIs2FaActive}
      />
      {!is2FaActive && <SocialDivider onSwitchToRegister={onSwitchToRegister} />}
    </div>
  );
};

export default LoginCard;
