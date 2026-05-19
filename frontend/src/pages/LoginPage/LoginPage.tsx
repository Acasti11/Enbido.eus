import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoginCard from './components/LoginCard';
import CreateUserCard from './components/CreateUserCard';  
import BackgroundCards from './components/BackgroundCards';
import './login-page.css';

const LoginPage: React.FC = (): React.JSX.Element => {
  const [isLogin, setIsLogin] = useState(true); 

  return (
    <div className="login-page">
      {/* El fondo decorativo (el cubo giratorio y demás) */}
      <BackgroundCards />
      
      {/* ¡AQUÍ ESTÁ LA MAGIA! Tu clase original que centra la tarjeta */}
      <main className="login-page__main">
        {isLogin ? (  
          <LoginCard onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <CreateUserCard onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </main>
      <BottomFeatures/>
      <ChatWidget />
    </div>
  );
};

export default LoginPage;