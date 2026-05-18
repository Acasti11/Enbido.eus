import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import LoginCard from './components/LoginCard';
import CreateUserCard from './components/CreateUserCard';  
import BackgroundCards from './components/BackgroundCards';
import BottomFeatures from './components/BottomFeatures';
import ChatWidget from './components/ChatWidget';
import './login-page.css';

const LoginPage: React.FC = (): React.JSX.Element => {
  const [isLogin, setIsLogin] = useState(true); 

  return (
    <div className="login-page">
      <BackgroundCards />
      <Navbar />
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