import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useNavbar } from './useNavbar';
import { useNavLinks } from './NavLinks';
import { NavLinks } from './NavLinks';
import { LogoIcon, ShopIcon, SettingsIcon } from './NavbarIcons';
import { UserDropdown } from './UserDropdown';
import { MobileDrawer } from './MobileDrawer';
import { SettingsModal } from './SettingsModal';
import { AgeModal } from './AgeModal';
import './navbar.css';

const Navbar: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const links = useNavLinks();

  const {
    user,
    isAdmin,
    settings,
    updateSetting,
    playSfx: rawPlaySfx,
    showSettingsModal,
    setShowSettingsModal,
    isDrawerOpen,
    isGameActive,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    showAgeModal,
    birthDateInput,
    setBirthDateInput,
    ageModalError,
    submittingAge,
    handleLogout,
    handleToggleDrawer,
    handleCloseDrawer,
    handleCloseSettings,
    handleSaveSettings,
    handleAgeSubmit,
  } = useNavbar();

  return (
    <header className={`navbar ${isGameActive ? 'navbar--hidden' : ''}`}>
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={() => rawPlaySfx('click')}>
          <LogoIcon />
          <span>ENBIDO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar__nav">
          <NavLinks links={links} />
        </nav>

        {/* Desktop Actions */}
        <div className="navbar__actions">
          <LanguageSwitcher />

          <Link
            to="/tienda"
            className="navbar__action-btn"
            onClick={() => rawPlaySfx('click')}
            title={t('nav.shop')}
          >
            <ShopIcon />
          </Link>

          <button
            className="navbar__action-btn"
            onClick={() => {
              rawPlaySfx('click');
              setShowSettingsModal(true);
            }}
            title={t('nav.settings')}
          >
            <SettingsIcon />
          </button>

          {isAuthenticated ? (
            <UserDropdown
              user={user}
              isAdmin={isAdmin}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              setShowSettingsModal={setShowSettingsModal}
              onLogout={handleLogout}
              playSfx={rawPlaySfx as unknown as (sound: string) => void}
              dropdownRef={dropdownRef}
            />
          ) : (
            <Link
              to="/login"
              className="navbar__login-btn"
              onClick={() => rawPlaySfx('click')}
            >
              {t('nav.login')}
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="navbar__hamburger"
          onClick={handleToggleDrawer}
          aria-label={t('nav.menu')}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        links={links}
        onClose={handleCloseDrawer}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        settings={settings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        onUpdateSetting={updateSetting}
        playSfx={rawPlaySfx as unknown as (sound: string) => void}
      />

      {/* Age Prompt Modal */}
      <AgeModal
        isOpen={showAgeModal}
        birthDateInput={birthDateInput}
        onBirthDateChange={setBirthDateInput}
        onSubmit={handleAgeSubmit}
        error={ageModalError}
        isSubmitting={submittingAge}
      />
    </header>
  );
};

export default Navbar;
