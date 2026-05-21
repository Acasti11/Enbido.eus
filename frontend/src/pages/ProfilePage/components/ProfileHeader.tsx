import React from 'react';
import './profile-header.css';

interface ProfileHeaderProps {
  username?: string;
  initials?: string;
  avatarItemId?: number;
  titleItemId?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username = 'Juan Pérez',
  initials = 'JP',
  avatarItemId,
  titleItemId
}): React.JSX.Element => {
  
  let avatarClass = "profile-header__avatar";
  if (avatarItemId === 1) avatarClass += " profile-header__avatar--gold";
  if (avatarItemId === 2) avatarClass += " profile-header__avatar--green";

  let subtitle = "Jugador activo";
  if (titleItemId === 5) subtitle = "El Tímido";
  if (titleItemId === 6) subtitle = "Maestro del Órdago";

  return (
    <div className="profile-header">
      <div className={avatarClass}>
        {initials}
      </div>
      <div>
        <h1 className="profile-header__username">{username}</h1>
        <p className="profile-header__subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;
