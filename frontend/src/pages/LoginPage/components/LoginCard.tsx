import React from 'react';
import CardLogo from './CardLogo';
import LoginForm from './LoginForm';
import SocialDivider from './SocialDivider';
import '../styles/login-card.css';

interface LoginCardProps {
  onSwitchToRegister: () => void;
  onSwitchToRecover: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onSwitchToRegister, onSwitchToRecover }): React.JSX.Element => {
  return (
    <div className="login-card">
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">Conectando con la mesa... / Mahaira konektatzen...</p>
      </div>
      <LoginForm onSwitchToRecover={onSwitchToRecover} />
      <SocialDivider onSwitchToRegister={onSwitchToRegister} />
    </div>
  );
};

export default LoginCard;