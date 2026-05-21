import React from 'react';
import ProfileHeader from './ProfileHeader';
import StatsGrid from './StatsGrid';
import './profile-card.css';

interface ProfileCardProps {
  username?: string;
  initials?: string;
  stats?: { label: string; value: number | string; icon: string }[];
  avatarItemId?: number;
  titleItemId?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ username, initials, stats, avatarItemId, titleItemId }): React.JSX.Element => {
  return (
    <div className="profile-card">
      <div className="profile-card__container">
        <ProfileHeader username={username} initials={initials} avatarItemId={avatarItemId} titleItemId={titleItemId} />
        <StatsGrid stats={stats} />
      </div>
    </div>
  );
};

export default ProfileCard;
