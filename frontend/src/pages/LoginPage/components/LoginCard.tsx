import React from 'react';
import { useTranslation } from 'react-i18next';
import CardLogo from './CardLogo';
import LoginForm from './LoginForm';
import SocialDivider from './SocialDivider';
import '../styles/login-card.css';

interface LoginCardProps {
  onSwitchToRegister: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onSwitchToRegister }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="login-card">
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">{t('login.subtitle')}</p>
      </div>
      <LoginForm />
      <SocialDivider onSwitchToRegister={onSwitchToRegister} />
    </div>
  );
};

export default LoginCard;
