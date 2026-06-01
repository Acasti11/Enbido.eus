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
  
  // Estados para Doble Factor (2FA)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2Fa, setLoading2Fa] = useState(true);
  const [updating2Fa, setUpdating2Fa] = useState(false);
  const [error2Fa, setError2Fa] = useState('');
  const [success2Fa, setSuccess2Fa] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile from DB:', err);
      }
    };
    
    const fetch2FaStatus = async () => {
      try {
        const res = await api.get('/usuarios/me');
        setTwoFactorEnabled(res.data.twoFactorEnabled || false);
      } catch (err) {
        console.error('Error fetching 2fa status:', err);
      } finally {
        setLoading2Fa(false);
      }
    };

    fetchProfile();
    fetch2FaStatus();
  }, []);

  const handleToggle2Fa = async (enabled: boolean) => {
    setUpdating2Fa(true);
    setError2Fa('');
    setSuccess2Fa('');
    try {
      const res = await api.post('/usuarios/me/2fa/toggle', { enabled });
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      setSuccess2Fa(enabled ? '¡Autenticación de Doble Factor (2FA) activada!' : 'Autenticación de Doble Factor (2FA) desactivada.');
      setTimeout(() => setSuccess2Fa(''), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al actualizar la configuración de 2FA';
      setError2Fa(msg);
      setTimeout(() => setError2Fa(''), 4000);
    } finally {
      setUpdating2Fa(false);
    }
  };

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
          twoFactorEnabled={twoFactorEnabled}
          loading2Fa={loading2Fa}
          updating2Fa={updating2Fa}
          onToggle2Fa={handleToggle2Fa}
          error2Fa={error2Fa}
          success2Fa={success2Fa}
        />
      </main>
      <ChatWidget />
    </div>
  );
};

export default ProfilePage;
