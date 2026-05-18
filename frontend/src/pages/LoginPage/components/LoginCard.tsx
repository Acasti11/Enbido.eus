import React from 'react';
import CardLogo from './CardLogo';
import LoginForm from './LoginForm';
import SocialDivider from './SocialDivider';
import './login-card.css';

interface LoginCardProps {
  onLoginSuccess: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLoginSuccess }) => {  return (
    <div className="login-card">
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">Connecting with the table...</p>
      </div>
      <LoginForm onLoginSuccess={onLoginSuccess} />
      <SocialDivider />
    </div>
  );
};

export default LoginCard;