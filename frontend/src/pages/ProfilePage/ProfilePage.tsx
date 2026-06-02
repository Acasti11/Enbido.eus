import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

interface ProfilePageContentProps {
  username: string;
  initials: string;
  stats?: { label: string; value: number | string; icon: string }[];
  profile: UserProfile | null;
  twoFactorEnabled: boolean;
  loading2Fa: boolean;
  updating2Fa: boolean;
  onToggle2Fa: (enabled: boolean) => void;
  error2Fa: string;
  success2Fa: string;
}

const ProfilePageContent: React.FC<ProfilePageContentProps> = ({
  username,
  initials,
  stats,
  profile,
  twoFactorEnabled,
  loading2Fa,
  updating2Fa,
  onToggle2Fa,
  error2Fa,
  success2Fa,
}): React.JSX.Element => (
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
        onToggle2Fa={onToggle2Fa}
        error2Fa={error2Fa}
        success2Fa={success2Fa}
      />
    </main>
    <ChatWidget />
  </div>
);

const useTwoFactor = () => {
  const { t } = useTranslation();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2Fa, setLoading2Fa] = useState(true);
  const [updating2Fa, setUpdating2Fa] = useState(false);
  const [error2Fa, setError2Fa] = useState('');
  const [success2Fa, setSuccess2Fa] = useState('');

  useEffect(() => {
    const fetch2FaStatus = async () => {
      try {
        const res = await api.get('/usuarios/me');
        setTwoFactorEnabled(res.data.twoFactorEnabled || false);
      } catch (err) {
        console.error('Error fetching 2FA status:', err);
      } finally {
        setLoading2Fa(false);
      }
    };
    fetch2FaStatus();
  }, []);

  const handleToggle2Fa = useCallback(async (enabled: boolean) => {
    setUpdating2Fa(true);
    setError2Fa('');
    setSuccess2Fa('');
    try {
      const res = await api.post('/usuarios/me/2fa/toggle', { enabled });
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      setSuccess2Fa(enabled ? t('profile.twoFactorEnabled') : t('profile.twoFactorDisabled'));
      setTimeout(() => setSuccess2Fa(''), 4000);
    } catch (err) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      const msg = errorResponse.response?.data?.error || t('profile.twoFactorError');
      setError2Fa(msg);
      setTimeout(() => setError2Fa(''), 4000);
    } finally {
      setUpdating2Fa(false);
    }
  }, [t]);

  return { twoFactorEnabled, loading2Fa, updating2Fa, error2Fa, success2Fa, handleToggle2Fa };
};

const ProfilePage: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const username = localStorage.getItem('username') || t('shop.defaultUsername');
  const initials = username.slice(0, 2).toUpperCase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { twoFactorEnabled, loading2Fa, updating2Fa, error2Fa, success2Fa, handleToggle2Fa } = useTwoFactor();

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
    { label: t('profile.gamesPlayed'), value: profile.totalGamesPlayed, icon: '🎴' },
    { label: t('profile.gamesWon'), value: profile.totalGamesWon, icon: '🏆' },
    { label: t('profile.elo'), value: profile.elo, icon: '📊' },
    { label: t('profile.coins'), value: profile.coins, icon: '💰' },
  ] : undefined;

  return (
    <ProfilePageContent
      username={username}
      initials={initials}
      stats={stats}
      profile={profile}
      twoFactorEnabled={twoFactorEnabled}
      loading2Fa={loading2Fa}
      updating2Fa={updating2Fa}
      onToggle2Fa={handleToggle2Fa}
      error2Fa={error2Fa}
      success2Fa={success2Fa}
    />
  );
};

export default ProfilePage;
