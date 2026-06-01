import React from 'react';
import '../styles/profile-header.css';

interface ProfileHeaderProps {
  username?: string;
  initials?: string;
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username = 'Juan Pérez',
  initials = 'JP',
  equippedAvatarItemId,
  equippedTitleItemId
}): React.JSX.Element => {
  // Configuración de la clase de avatar según item equipado
  let avatarClass = '';
  if (equippedAvatarItemId === 1) {
    avatarClass = 'profile-header__avatar--gold';
  } else if (equippedAvatarItemId === 2) {
    avatarClass = 'profile-header__avatar--green';
  }

  // Renderizado del título
  const renderSubtitle = () => {
    if (equippedTitleItemId === 5) {
      return (
        <p className="profile-header__subtitle profile-header__subtitle--handia">
          🔰 HANDIA
        </p>
      );
    }
    if (equippedTitleItemId === 6) {
      return (
        <p className="profile-header__subtitle profile-header__subtitle--maisu">
          👑 ENBIDO MAISU
        </p>
      );
    }
    return <p className="profile-header__subtitle">Jugador activo</p>;
  };

  return (
    <div className="profile-header">
      <div className={`profile-header__avatar ${avatarClass}`}>
        {initials}
      </div>
      <div className="profile-header__info">
        <h1 className="profile-header__username">{username}</h1>
        {renderSubtitle()}
      </div>
    </div>
  );
};

export default ProfileHeader;
