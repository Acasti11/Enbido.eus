import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomePage from '@/pages/HomePage/HomePage';
import LoginPage from '@/pages/LoginPage/LoginPage';
import MusGamePage from '@/features/game/components/MusGamePage';
import TournamentPage from '@/features/tournament/components/TournamentPage';
import MeetupPage from '@/features/meetup/components/MeetupPage';
import ShopPage from '@/features/shop/components/ShopPage';
import ProfilePage from '@/pages/ProfilePage/ProfilePage';
import AccountPage from '@/pages/AccountPage/AccountPage';
import RulesPage from '@/pages/RulesPage/RulesPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage/ResetPasswordPage';
import AdminPage from '@/pages/AdminPage/AdminPage';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="page">
      <h1>{t('common.notFound')}</h1>
    </div>
  );
};

export const AppRouter: React.FC = (): React.JSX.Element => {
  return (
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
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
