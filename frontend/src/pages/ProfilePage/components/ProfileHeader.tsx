import React from 'react';
import './profile-header.css';

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
  // Configuración del estilo de borde de avatar
  let avatarStyle: React.CSSProperties = {};
  if (equippedAvatarItemId === 1) {
    avatarStyle = {
      border: '5px solid #d4af37',
      boxShadow: '0 0 22px rgba(212, 175, 55, 0.85)',
      transform: 'scale(1.03)'
    };
  } else if (equippedAvatarItemId === 2) {
    avatarStyle = {
      border: '5px solid #2e7d32',
      boxShadow: '0 0 20px rgba(46, 125, 50, 0.7)',
      transform: 'scale(1.02)'
    };
  }

  // Renderizado del título
  const renderSubtitle = () => {
    if (equippedTitleItemId === 5) {
      return (
        <p className="profile-header__subtitle" style={{ color: '#2e7d32', fontWeight: 900, letterSpacing: '0.15em' }}>
          🔰 HANDIA
        </p>
      );
    }
    if (equippedTitleItemId === 6) {
      return (
        <p className="profile-header__subtitle" style={{ color: '#b8860b', fontWeight: 900, letterSpacing: '0.15em' }}>
          👑 ENBIDO MAISU
        </p>
      );
    }
    return <p className="profile-header__subtitle">Jugador activo</p>;
  };

  return (
    <div className="profile-header">
      <div className="profile-header__avatar" style={avatarStyle}>
        {initials}
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 className="profile-header__username">{username}</h1>
        {renderSubtitle()}
      </div>
    </div>
  );
};

export default ProfileHeader;
