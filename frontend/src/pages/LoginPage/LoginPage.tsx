import React, { useState } from 'react';
// Quitamos el import de Navbar que no se usaba
import LoginCard from './components/LoginCard';
import CreateUserCard from './components/CreateUserCard';  
import RecoverPasswordCard from './components/RecoverPasswordCard'; // <- Import añadido
import BackgroundCards from './components/BackgroundCards';
import BottomFeatures from './components/BottomFeatures'; // <- Import añadido
import ChatWidget from './components/ChatWidget';         // <- Import añadido
import './login-page.css';

const LoginPage: React.FC = (): React.JSX.Element => {
  const [view, setView] = useState<'login' | 'register' | 'recover'>('login'); 

  return (
    <div className="login-page">
      {/* El fondo decorativo */}
      <BackgroundCards />
      
      {/* Contenedor principal que centra la tarjeta */}
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
      
      <BottomFeatures />
      <ChatWidget />
    </div>
  );
};

export default LoginPage;