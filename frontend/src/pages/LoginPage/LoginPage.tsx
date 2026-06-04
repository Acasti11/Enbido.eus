import React, { useState } from 'react';
import LoginCard from './components/LoginCard';
import CreateUserCard from './components/CreateUserCard';
import RecoverPasswordCard from './components/RecoverPasswordCard'; // <- Import añadido
import BackgroundCards from './components/BackgroundCards';
import './login-page.css';

const LoginPage: React.FC = (): React.JSX.Element => {
  const [view, setView] = useState<'login' | 'register' | 'recover'>('login');

  return (
    <div className="login-page">
      {/* Decorative background */}
      <BackgroundCards />

      {/* Main container that centers the card */}
      <main className="login-page__main">
        {view === 'login' && (
          <LoginCard 
            onSwitchToRegister={() => setView('register')} 
            onSwitchToRecover={() => setView('recover')} 
          />
        )}
        {view === 'register' && (
          <CreateUserCard onSwitchToLogin={() => setView('login')} />
        )}
        {view === 'recover' && (
          <RecoverPasswordCard onSwitchToLogin={() => setView('login')} />
        )}
      </main>
    </div>
  );
};

export default LoginPage;
