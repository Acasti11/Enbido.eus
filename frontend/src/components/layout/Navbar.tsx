import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './navbar.css';

import { useSettings } from '../../context/SettingsContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';

// ========== SVGS AS COMPONENTS ==========

const LogoIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const UserAvatarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ShopIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ========== COMPONENT ==========

const Navbar: React.FC = (): React.JSX.Element => {
  const location = useLocation();
  const { settings, updateSetting, saveSettingsToDb, playSfx } = useSettings();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Age based initial ELO check states
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState('');
  const [ageModalError, setAgeModalError] = useState('');
  const [submittingAge, setSubmittingAge] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState<any>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const checkGameState = () => {
      setIsGameActive(localStorage.getItem('isGameActive') === 'true');
    };
    checkGameState();
    window.addEventListener('game_state_changed', checkGameState);
    return () => window.removeEventListener('game_state_changed', checkGameState);
  }, []);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated && !sessionStorage.getItem('enbido_age_checked')) {
      api.get('/usuarios/me')
        .then(res => {
          setCurrentUserDetails(res.data);
          if (!res.data.birthDate) {
            setShowAgeModal(true);
          } else {
            sessionStorage.setItem('enbido_age_checked', 'true');
          }
        })
        .catch(err => {
          console.error('Error checking user age on login:', err);
        });
    }
  }, [isAuthenticated, location.pathname]);

  const handleAgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDateInput) {
      setAgeModalError(t('login.requiredField'));
      return;
    }

    const birthDate = new Date(birthDateInput);
    const today = new Date();
    if (birthDate >= today) {
      setAgeModalError(t('login.invalidBirthDate'));
      return;
    }

    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 3);
    if (birthDate > minDate) {
      setAgeModalError(t('login.invalidBirthDate'));
      return;
    }

    setSubmittingAge(true);
    setAgeModalError('');

    try {
      await api.put('/usuarios/me', {
        name: currentUserDetails?.name || '',
        surname: currentUserDetails?.surname || '',
        phoneNumber: currentUserDetails?.phoneNumber || '',
        postalCode: currentUserDetails?.postalCode || '',
        birthDate: birthDateInput
      });

      sessionStorage.setItem('enbido_age_checked', 'true');
      setShowAgeModal(false);
      window.dispatchEvent(new Event('enbido_login'));
    } catch (err) {
      console.error('Error setting age:', err);
      setAgeModalError(t('account.updateError'));
    } finally {
      setSubmittingAge(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isDrawerOpen]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleToggleDrawer = useCallback(() => {
    playSfx('click');
    setIsDrawerOpen((prev) => !prev);
  }, [playSfx]);

  const handleCloseDrawer = useCallback(() => {
    playSfx('click');
    setIsDrawerOpen(false);
  }, [playSfx]);

  const handleCloseSettings = useCallback(() => {
    playSfx('click');
    setShowSettingsModal(false);
  }, [playSfx]);

  const handleSaveSettings = useCallback(async () => {
    playSfx('click');
    await saveSettingsToDb();
    setShowSettingsModal(false);
  }, [playSfx, saveSettingsToDb]);

  const navLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.play'), to: '/jugar' },
    { label: t('nav.tournaments'), to: '/torneos' },
    { label: t('nav.meetups'), to: '/quedadas' },
  ];

  const renderNavLinks = (): React.JSX.Element[] => {
    return navLinks.map((link) => {
      const isActive = location.pathname === link.to;
      return (
        <Link
          key={link.to}
          to={link.to}
          className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
        >
          {link.label}
        </Link>
      );
    });
  };

  const renderDrawerLinks = (): React.JSX.Element[] => {
    return navLinks.map((link) => {
      const isActive = location.pathname === link.to;
      return (
        <Link
          key={link.to}
          to={link.to}
          className={`navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`}
          onClick={handleCloseDrawer}
        >
          {link.label}
        </Link>
      );
    });
  };

  if (isGameActive && location.pathname === '/jugar') {
    return <></>;
  }

  return (
    <header className="navbar">
      <button
        className={`navbar__hamburger ${isDrawerOpen ? 'navbar__hamburger--open' : ''}`}
        onClick={handleToggleDrawer}
        aria-label={t('nav.settings')}
        aria-expanded={isDrawerOpen}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      <div className="navbar__brand">
        <Link to="/" className="navbar__logo">
          <LogoIcon />
        </Link>
        <Link to="/" className="navbar__title">ENBIDO</Link>
      </div>

      <nav className="navbar__nav">
        {renderNavLinks()}
      </nav>

      <div className="navbar__actions">
        <Link to="/tienda" className="navbar__shop-btn" title={t('nav.shop')} onClick={() => playSfx('click')}>
          <ShopIcon />
        </Link>

        <LanguageSwitcher />

        {isAuthenticated ? (
          <div className="navbar__profile" ref={dropdownRef}>
            <button
              className="navbar__profile-trigger"
              onClick={() => {
                playSfx('click');
                setIsDropdownOpen(prev => !prev);
              }}
              title={user?.username}
            >
              <div className="navbar__profile-avatar">
                <UserAvatarIcon />
              </div>
              <span className="navbar__profile-name">{user?.username || t('nav.profile')}</span>
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
                  onClick={() => {
                    playSfx('click');
                    setIsDropdownOpen(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <span className="navbar__dropdown-icon">⚙️</span>
                  <span className="navbar__dropdown-text">{t('nav.settings')}</span>
                </button>

                <Link
                  to="/perfil"
                  className="navbar__dropdown-item"
                  onClick={() => {
                    playSfx('click');
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="navbar__dropdown-icon">🃏</span>
                  <span className="navbar__dropdown-text">{t('nav.gameProfile')}</span>
                </Link>

                <Link
                  to="/cuenta"
                  className="navbar__dropdown-item"
                  onClick={() => {
                    playSfx('click');
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="navbar__dropdown-icon">👤</span>
                  <span className="navbar__dropdown-text">{t('nav.accountProfile')}</span>
                </Link>

                <div className="navbar__dropdown-divider" />

                <button
                  className="navbar__dropdown-item navbar__dropdown-item--logout"
                  onClick={() => {
                    playSfx('click');
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                >
                  <span className="navbar__dropdown-icon">
                    <LogoutIcon />
                  </span>
                  <span className="navbar__dropdown-text">{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="navbar__login-btn" onClick={() => playSfx('click')}>
            {t('nav.login')}
          </Link>
        )}
      </div>

      {/* Mobile drawer */}
      {createPortal(
        <>
          <div className={`navbar__drawer ${isDrawerOpen ? 'navbar__drawer--open' : ''}`}>
            <div className="navbar__drawer-header">
              <span className="navbar__drawer-title">ENBIDO</span>
              <button
                className="navbar__drawer-close"
                onClick={handleCloseDrawer}
              >
                ✕
              </button>
            </div>
            <nav className="navbar__drawer-nav">
              {renderDrawerLinks()}
            </nav>
            <div className="navbar__drawer-actions">
              <Link
                to="/tienda"
                className="navbar__drawer-action-btn"
                onClick={handleCloseDrawer}
              >
                <ShopIcon /> {t('nav.shop')}
              </Link>
              <button
                className="navbar__drawer-action-btn"
                onClick={() => {
                  handleCloseDrawer();
                  setShowSettingsModal(true);
                }}
              >
                <SettingsIcon /> {t('nav.settings')}
              </button>
            </div>
          </div>
          {isDrawerOpen && <div className="navbar__overlay" onClick={() => setIsDrawerOpen(false)} />}
        </>,
        document.body
      )}

      {/* Settings Modal */}
      {showSettingsModal && createPortal(
        <div className="settings-modal-overlay" onClick={handleCloseSettings}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <header className="settings-modal-header">
              <h2>{t('settings.title')}</h2>
              <button
                className="settings-close-btn"
                onClick={handleCloseSettings}
              >
                {t('settings.close')}
              </button>
            </header>

            <div className="settings-modal-body">
              <div className="settings-section">
                <h3>{t('settings.audioSection')}</h3>
                <div className="settings-row">
                  <label>{t('settings.music')}</label>
                  <input
                    type="checkbox"
                    className="settings-toggle"
                    checked={settings.musicEnabled}
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('musicEnabled', e.target.checked);
                    }}
                  />
                </div>
                {settings.musicEnabled && (
                  <div className="settings-row flex-column">
                    <div className="flex-row-spaced">
                      <label>{t('settings.musicVolume')}</label>
                      <span className="settings-val-lbl">{Math.round(settings.musicVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.musicVolume}
                      onChange={(e) => {
                        updateSetting('musicVolume', parseFloat(e.target.value));
                      }}
                      className="settings-slider"
                    />
                  </div>
                )}
                <div className="settings-row">
                  <label>{t('settings.soundEffects')}</label>
                  <input
                    type="checkbox"
                    className="settings-toggle"
                    checked={settings.soundEnabled}
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('soundEnabled', e.target.checked);
                    }}
                  />
                </div>
                {settings.soundEnabled && (
                  <div className="settings-row flex-column">
                    <div className="flex-row-spaced">
                      <label>{t('settings.soundVolume')}</label>
                      <span className="settings-val-lbl">{Math.round(settings.soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.soundVolume}
                      onChange={(e) => {
                        updateSetting('soundVolume', parseFloat(e.target.value));
                      }}
                      className="settings-slider"
                    />
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>{t('settings.gameSection')}</h3>
                <div className="settings-row flex-column">
                  <label>{t('settings.viewMode')}</label>
                  <select
                    value={settings.viewMode}
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('viewMode', e.target.value as '2d' | '3d');
                    }}
                    className="settings-select"
                  >
                    <option value="2d">{t('settings.view2d')}</option>
                    <option value="3d">{t('settings.view3d')}</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('settings.notifSection')}</h3>
                <div className="settings-row">
                  <label>{t('settings.notifications')}</label>
                  <input
                    type="checkbox"
                    className="settings-toggle"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('notificationsEnabled', e.target.checked);
                    }}
                  />
                </div>
                <div className="settings-row flex-column">
                  <label>{t('settings.language')}</label>
                  <select
                    value={settings.language}
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('language', e.target.value as 'es' | 'eu' | 'en');
                    }}
                    className="settings-select"
                  >
                    <option value="es">{t('settings.langEs')}</option>
                    <option value="eu">{t('settings.langEu')}</option>
                    <option value="en">{t('settings.langEn')}</option>
                  </select>
                </div>
              </div>
            </div>

            <footer className="settings-modal-footer">
              <button
                className="settings-save-btn"
                onClick={handleSaveSettings}
              >
                {t('settings.save')}
              </button>
            </footer>
          </div>
        </div>,
        document.body
      )}

      {/* Age Prompt Modal */}
      {showAgeModal && createPortal(
        <div className="settings-modal-overlay age-modal-overlay">
          <div className="settings-modal age-modal">
            <h2 className="age-modal__title">
              🎂 {t('login.agePromptTitle')}
            </h2>
            <p className="age-modal__desc">
              {t('login.agePromptDesc')}
            </p>
            <form onSubmit={handleAgeSubmit}>
              <input
                type="date"
                className="settings-select age-modal__input"
                value={birthDateInput}
                onChange={(e) => setBirthDateInput(e.target.value)}
                disabled={submittingAge}
                required
              />
              {ageModalError && (
                <p className="age-modal__error">
                  {ageModalError}
                </p>
              )}
              <button
                type="submit"
                className="settings-save-btn age-modal__submit"
                disabled={submittingAge}
              >
                {submittingAge ? t('common.loading') : t('login.agePromptSubmit')}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;
