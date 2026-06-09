import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogoutIcon, UserAvatarIcon } from './NavbarIcons';
import type { UserDetails } from './navbarTypes';

interface UserDropdownProps {
  user: UserDetails | null;
  isAdmin: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowSettingsModal: (value: boolean) => void;
  onLogout: () => void;
  playSfx: (sound: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  isAdmin,
  isDropdownOpen,
  setIsDropdownOpen,
  setShowSettingsModal,
  onLogout,
  playSfx,
  dropdownRef,
}) => {
  const { t } = useTranslation();

  const handleClick = (action: () => void) => {
    playSfx('click');
    setIsDropdownOpen(false);
    action();
  };

  return (
    <div className="navbar__profile" ref={dropdownRef}>
      <button
        className="navbar__profile-trigger"
        onClick={() => {
          playSfx('click');
          setIsDropdownOpen(prev => !prev);
        }}
        title={user?.name || t('nav.profile')}
      >
        <span className="navbar__profile-avatar">
          <UserAvatarIcon />
        </span>
        <span className="navbar__profile-name">{user?.name || t('nav.profile')}</span>
        <svg
          className={`navbar__profile-caret ${isDropdownOpen ? 'navbar__profile-caret--open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="navbar__dropdown">
          <button
            className="navbar__dropdown-item"
            onClick={() => handleClick(() => setShowSettingsModal(true))}
          >
            <span className="navbar__dropdown-icon">⚙️</span>
            <span className="navbar__dropdown-text">{t('nav.settings')}</span>
          </button>

          <Link
            to="/perfil"
            className="navbar__dropdown-item"
            onClick={() => handleClick(() => {})}
          >
            <span className="navbar__dropdown-icon">🃏</span>
            <span className="navbar__dropdown-text">{t('nav.gameProfile')}</span>
          </Link>

          <Link
            to="/cuenta"
            className="navbar__dropdown-item"
            onClick={() => handleClick(() => {})}
          >
            <span className="navbar__dropdown-icon">👤</span>
            <span className="navbar__dropdown-text">{t('nav.accountProfile')}</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="navbar__dropdown-item"
              onClick={() => handleClick(() => {})}
            >
              <span className="navbar__dropdown-icon">⚙️</span>
              <span className="navbar__dropdown-text">Panel Admin</span>
            </Link>
          )}

          <div className="navbar__dropdown-divider" />

          <button
            className="navbar__dropdown-item navbar__dropdown-item--logout"
            onClick={() => handleClick(onLogout)}
          >
            <span className="navbar__dropdown-icon">
              <LogoutIcon />
            </span>
            <span className="navbar__dropdown-text">{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
