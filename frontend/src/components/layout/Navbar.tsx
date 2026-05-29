import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './navbar.css';

import { useSettings } from '../../context/SettingsContext';

// ========== SVGS COMO COMPONENTES ==========

const LogoIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const ChevronDownIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
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

// ========== DATOS ==========

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Jugar', to: '/jugar' },
  { label: 'Torneos', to: '/torneos' },
  { label: 'Quedadas', to: '/quedadas' },
];

// ========== COMPONENTE PRINCIPAL ==========

const Navbar: React.FC = (): React.JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, updateSetting, saveSettingsToDb, playSfx } = useSettings();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (token) {
      setIsLoggedIn(true);
      setUsername(storedUsername || '');
    } else {
      setIsLoggedIn(false);
      setUsername('');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const renderNavLinks = (): React.JSX.Element[] => {
    return NAV_LINKS.map((link) => {
      const isActive = location.pathname === link.to;
      return (
        <Link
          key={link.label}
          to={link.to}
          className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
        >
          {link.label}
        </Link>
      );
    });
  };

  return (
    <header className="navbar">
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


      <Link to="/tienda" className="navbar__shop-btn" title="Tienda" onClick={() => playSfx('click')}>
        <ShopIcon />
      </Link>

      <button 
        className="navbar__shop-btn" 
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        title="Ajustes" 
        onClick={() => {
          playSfx('click');
          setShowSettingsModal(true);
        }}
      >
        <SettingsIcon />
      </button>

        <button className="navbar__lang" onClick={() => playSfx('click')}>
          ES
          <ChevronDownIcon />
        </button>
      


        {isLoggedIn ? (
          <div className="navbar__profile">
            <Link to="/perfil" className="navbar__profile-link" title={username} onClick={() => playSfx('click')}>
              <div className="navbar__profile-avatar">
                <UserAvatarIcon />
              </div>
              <span className="navbar__profile-name">{username || 'Perfil'}</span>
            </Link>
            <button 
              className="navbar__logout-btn" 
              onClick={() => {
                playSfx('click');
                handleLogout();
              }}
              title="Cerrar sesión"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <Link to="/login" className="navbar__login-btn" onClick={() => playSfx('click')}>Login</Link>
        )}
      </div>

      {/* ---------- SETTINGS MODAL ---------- */}
      {showSettingsModal && createPortal(
        <div className="settings-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <header className="settings-modal-header">
              <h2>Ajustes del Juego</h2>
              <button 
                className="settings-close-btn" 
                onClick={() => {
                  playSfx('click');
                  setShowSettingsModal(false);
                }}
              >
                ✕
              </button>
            </header>

            <div className="settings-modal-body">
              {/* Audio & Sound */}
              <div className="settings-section">
                <h3>🔊 Audio y Sonidos</h3>
                <div className="settings-row">
                  <label>Música de Fondo</label>
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
                      <label>Volumen Música</label>
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
                  <label>Efectos de Sonido</label>
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
                      <label>Volumen Efectos</label>
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

              {/* Game Settings */}
              <div className="settings-section">
                <h3>🎮 Preferencias de Juego</h3>
                <div className="settings-row flex-column">
                  <label>Vista de la Mesa</label>
                  <select 
                    value={settings.viewMode} 
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('viewMode', e.target.value as '2d' | '3d');
                    }}
                    className="settings-select"
                  >
                    <option value="2d">Mesa de Mus 2D Clásica</option>
                    <option value="3d">Mesa de Mus 3D Isométrica</option>
                  </select>
                </div>
              </div>

              {/* Notifications & Language */}
              <div className="settings-section">
                <h3>⚙️ Notificaciones e Idioma</h3>
                <div className="settings-row">
                  <label>Notificaciones Chat/Amigos</label>
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
                  <label>Idioma Preferido</label>
                  <select 
                    value={settings.language} 
                    onChange={(e) => {
                      playSfx('click');
                      updateSetting('language', e.target.value as 'es' | 'eu' | 'en');
                    }}
                    className="settings-select"
                  >
                    <option value="es">Castellano (ES)</option>
                    <option value="eu">Euskera (EU)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>
            </div>

            <footer className="settings-modal-footer">
              <button 
                className="settings-save-btn" 
                onClick={async () => {
                  playSfx('click');
                  await saveSettingsToDb();
                  setShowSettingsModal(false);
                }}
              >
                Guardar Ajustes
              </button>
            </footer>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;