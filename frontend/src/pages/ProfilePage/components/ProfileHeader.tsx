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
  } else if (equippedAvatarItemId === 7) {
    avatarClass = 'profile-header__avatar--ikurrina';
  } else if (equippedAvatarItemId === 8) {
    avatarClass = 'profile-header__avatar--karta';
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
    if (equippedTitleItemId === 11) {
      return (
        <p className="profile-header__subtitle profile-header__subtitle--txapeldun">
          🏆 TXAPELDUN
        </p>
      );
    }
    if (equippedTitleItemId === 12) {
      return (
        <p className="profile-header__subtitle profile-header__subtitle--musolari">
          🃏 MUSOLARI
        </p>
      );
    }
    if (equippedTitleItemId === 13) {
      return (
        <p className="profile-header__subtitle profile-header__subtitle--zazpi">
          🌟 ZAZPI ETA ERDI
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
