import React from 'react';
import './profile-header.css';

interface ProfileHeaderProps {
  username?: string;
  initials?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username = 'Juan Pérez',
  initials = 'JP'
}): React.JSX.Element => {
  return (
    <div className="profile-header">
      <div className="profile-header__avatar">
        {initials}
      </div>
      <div>
        <h1 className="profile-header__username">{username}</h1>
        <p className="profile-header__subtitle">Jugador activo</p>
      </div>
    </div>
  );
};

export default ProfileHeader;
