import React from 'react';
import ProfileHeader from './ProfileHeader';
import StatsGrid from './StatsGrid';
import '../styles/profile-card.css';

interface ProfileCardProps {
  username?: string;
  initials?: string;
  stats?: { label: string; value: number | string; icon: string }[];
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  username,
  initials,
  stats,
  equippedAvatarItemId,
  equippedTitleItemId,
}): React.JSX.Element => {
  return (
    <div className="profile-card">
      <div className="profile-card__container">
        <ProfileHeader
          username={username}
          initials={initials}
          equippedAvatarItemId={equippedAvatarItemId}
          equippedTitleItemId={equippedTitleItemId}
        />
        <StatsGrid stats={stats} />
      </div>
    </div>
  );
};

export default ProfileCard;
