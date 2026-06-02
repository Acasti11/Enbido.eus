import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/profile-header.css';

interface ProfileHeaderProps {
  username?: string;
  initials?: string;
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}

const ProfileSubtitle: React.FC<{ equippedTitleItemId?: number }> = ({ equippedTitleItemId }): React.JSX.Element => {
  const { t } = useTranslation();

  if (equippedTitleItemId === 5) {
    return (
      <p className="profile-header__subtitle profile-header__subtitle--handia">
        🔰 {t('musGame.titleHandia')}
      </p>
    );
  }
  if (equippedTitleItemId === 6) {
    return (
      <p className="profile-header__subtitle profile-header__subtitle--maisu">
        👑 {t('musGame.titleEnbidoMaisu')}
      </p>
    );
  }
  return <p className="profile-header__subtitle">{t('profile.activePlayer')}</p>;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  initials,
  equippedAvatarItemId,
  equippedTitleItemId,
}): React.JSX.Element => {
  const { t } = useTranslation();
  const displayName = username || t('shop.defaultUsername');
  const displayInitials = initials || displayName.slice(0, 2).toUpperCase();

  let avatarClass = '';
  if (equippedAvatarItemId === 1) {
    avatarClass = 'profile-header__avatar--gold';
  } else if (equippedAvatarItemId === 2) {
    avatarClass = 'profile-header__avatar--green';
  }

  return (
    <div className="profile-header">
      <div className={`profile-header__avatar ${avatarClass}`}>
        {displayInitials}
      </div>
      <div className="profile-header__info">
        <h1 className="profile-header__username">{displayName}</h1>
        <ProfileSubtitle equippedTitleItemId={equippedTitleItemId} />
      </div>
    </div>
  );
};

export default ProfileHeader;
