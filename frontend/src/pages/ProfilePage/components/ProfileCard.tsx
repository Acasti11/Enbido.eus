import React from 'react';
import ProfileHeader from './ProfileHeader';
import StatsGrid from './StatsGrid';
import './profile-card.css';

interface ProfileCardProps {
  username?: string;
  initials?: string;
  stats?: { label: string; value: number | string; icon: string }[];
}

const ProfileCard: React.FC<ProfileCardProps> = ({ username, initials, stats }): React.JSX.Element => {
  return (
    <div className="profile-card">
      <div className="profile-card__container">
        <ProfileHeader username={username} initials={initials} />
        <StatsGrid stats={stats} />
      </div>
    </div>
  );
};

export default ProfileCard;
