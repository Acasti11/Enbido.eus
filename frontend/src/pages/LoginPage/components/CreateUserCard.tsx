import React from 'react';
import { useTranslation } from 'react-i18next';
import CardLogo from './CardLogo';
import CreateUserForm from './CreateUserForm';
import '../styles/login-card.css';

interface CreateUserCardProps {
  onSwitchToLogin: () => void;
}

const CreateUserCard: React.FC<CreateUserCardProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="login-card">
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">{t('login.registerSubtitle')}</p>
      </div>
      <CreateUserForm onSwitchToLogin={onSwitchToLogin} />
    </div>
  );
};

export default CreateUserCard;
