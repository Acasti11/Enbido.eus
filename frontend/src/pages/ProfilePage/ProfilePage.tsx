import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
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
}

const ProfilePageContent: React.FC<ProfilePageContentProps> = ({
  username,
  initials,
  stats,
  profile,
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
      />
    </main>
    <ChatWidget />
  </div>
);

const ProfilePage: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const username = user?.username || t('shop.defaultUsername');
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
    />
  );
};

export default ProfilePage;
