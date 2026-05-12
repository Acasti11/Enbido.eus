import React from 'react';
import Navbar from '../../components/layout/Navbar';
import LoginCard from './components/LoginCard';
import BackgroundCards from './components/BackgroundCards';
import BottomFeatures from './components/BottomFeatures';
import ChatWidget from './components/ChatWidget';
import './login-page.css';

const LoginPage: React.FC = (): React.JSX.Element => {
  return (
    <div className="login-page">
      <BackgroundCards />
      <Navbar />
      <main className="login-page__main">
        <LoginCard />
      </main>
      <BottomFeatures />
      <ChatWidget />
    </div>
  );
};

export default LoginPage;