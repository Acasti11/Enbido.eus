import React from 'react';
import CardLogo from './CardLogo';
import CreateUserForm from './CreateUserForm';
import '../styles/login-card.css';  // Reusa los mismos estilos

interface CreateUserCardProps {
  onSwitchToLogin: () => void;
}

const CreateUserCard: React.FC<CreateUserCardProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  return (
    <div className="login-card">  {/* Reusa la clase login-card para mismo estilo */}
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">Create your account...</p>
      </div>
      <CreateUserForm onSwitchToLogin={onSwitchToLogin} />
    </div>
  );
};

export default CreateUserCard;