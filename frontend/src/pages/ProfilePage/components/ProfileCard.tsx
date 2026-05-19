import React from 'react';
import ProfileHeader from './ProfileHeader';
import StatsGrid from './StatsGrid';
import './profile-card.css';

const ProfileCard: React.FC = (): React.JSX.Element => {
  return (
    <div className="profile-card">
      <div className="profile-card__container">
        <ProfileHeader />
        <StatsGrid />
      </div>
    </div>
  );
};

export default ProfileCard;
