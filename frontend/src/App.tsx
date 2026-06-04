import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage/LoginPage';
import MeetupPage from './pages/MeetUp/MeetupPage';
import TournamentPage from './pages/TournamentPage/TournamentPage';
import MusGamePage from './pages/MusGamePage/MusGamePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ShopPage from './pages/ShopPage/ShopPage';
import HomePage from './pages/HomePage/HomePage';
import RulesPage from './pages/RulesPage/RulesPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import AccountPage from './pages/AccountPage/AccountPage';
import GlobalChatWindow from './components/chat/GlobalChatWindow';
import { ChatProvider } from './context/ChatContext';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="page">
      <h1>{t('common.notFound')}</h1>
    </div>
  );
};

const App: React.FC = (): React.JSX.Element => {
  return (
    <BrowserRouter>
      <ChatProvider>
        <div className="app">
          <Navbar />
          <main className="app__main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/jugar" element={<MusGamePage />} />
              <Route path="/torneos" element={<TournamentPage />} />
              <Route path="/quedadas" element={<MeetupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/recuperar-password" element={<ResetPasswordPage />} />
              <Route path="/tienda" element={<ShopPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/cuenta" element={<AccountPage />} />
              <Route path="/reglas" element={<RulesPage />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <GlobalChatWindow />
        </div>
      </ChatProvider>
    </BrowserRouter>
  );
};

export default App;
