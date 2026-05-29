import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import ProfileCard from './components/ProfileCard';
import BackgroundCards from './components/BackgroundCards';
import ChatWidget from './components/ChatWidget';
import './styles/profile-page.css';

interface UserProfile {
  elo: number;
  coins: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}

const ProfilePage: React.FC = (): React.JSX.Element => {
  const username = localStorage.getItem('username') || 'Juan Pérez';
  const initials = username.slice(0, 2).toUpperCase();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile from DB:', err);
      }
    };
    fetchProfile();
  }, []);

  const stats = profile ? [
    {
      label: 'Partidas Jugadas',
      value: profile.totalGamesPlayed,
      icon: '🎴',
    },
    {
      label: 'Partidas Ganadas',
      value: profile.totalGamesWon,
      icon: '🏆',
    },
    {
      label: 'ELO',
      value: profile.elo,
      icon: '📊',
    },
    {
      label: 'Monedas',
      value: profile.coins,
      icon: '💰',
    },
  ] : undefined;

  return (
    <div className="profile-page">
      <BackgroundCards />
      <main className="profile-page__main">
        <ProfileCard
          username={username}
          initials={initials}
          stats={stats}
          equippedAvatarItemId={profile?.equippedAvatarItemId}
          equippedTitleItemId={profile?.equippedTitleItemId}
        />
      </main>
      <ChatWidget />
    </div>
  );
};

export default ProfilePage;
