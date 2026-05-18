import React from 'react';
import LoginCard from './components/LoginCard';
import BackgroundCards from './components/BackgroundCards';
import './login-page.css';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }): React.JSX.Element => {
  return (
    <div className="login-page">
      {/* El fondo decorativo (el cubo giratorio y demás) */}
      <BackgroundCards />
      
      {/* ¡AQUÍ ESTÁ LA MAGIA! Tu clase original que centra la tarjeta */}
      <main className="login-page__main">
        <LoginCard onLoginSuccess={onLoginSuccess} />
      </main>
    </div>
  );
};

export default LoginPage;