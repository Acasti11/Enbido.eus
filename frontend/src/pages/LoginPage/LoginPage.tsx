import React, { useState } from 'react';
// Quitamos el import de Navbar que no se usaba
import LoginCard from './components/LoginCard';
import CreateUserCard from './components/CreateUserCard';  
import BackgroundCards from './components/BackgroundCards';
import BottomFeatures from './components/BottomFeatures'; // <- Import añadido
import ChatWidget from './components/ChatWidget';         // <- Import añadido
import './login-page.css';

const LoginPage: React.FC = (): React.JSX.Element => {
  const [isLogin, setIsLogin] = useState(true); 

  return (
    <div className="login-page">
      {/* El fondo decorativo */}
      <BackgroundCards />
      
      {/* Contenedor principal que centra la tarjeta */}
      <main className="login-page__main">
        {isLogin ? (  
          <LoginCard onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <CreateUserCard onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </main>
      
      <BottomFeatures />
      <ChatWidget />
    </div>
  );
};

export default LoginPage;