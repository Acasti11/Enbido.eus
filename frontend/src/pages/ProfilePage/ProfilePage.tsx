import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/layout/Navbar';
import ProfileCard from './components/ProfileCard';
import BackgroundCards from './components/BackgroundCards';
import ChatWidget from './components/ChatWidget';
import './profile-page.css';

interface UserProfile {
  elo: number;
  coins: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
}

const ProfilePage: React.FC = (): React.JSX.Element => {
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = savedUser.userId || savedUser.user_id || 1;
  const username = savedUser.username || 'Juan Pérez';
  const initials = username.slice(0, 2).toUpperCase();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/usuarios/${currentUserId}/profile`);
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile from DB:', err);
      }
    };
    fetchProfile();
  }, [currentUserId]);

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
      <Navbar />
      <main className="profile-page__main">
        <ProfileCard username={username} initials={initials} stats={stats} />
      </main>
      <ChatWidget />
    </div>
  );
};

export default ProfilePage;
