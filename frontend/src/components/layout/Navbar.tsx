import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './navbar.css';

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
// ========== DATOS ==========

const NAV_LINKS = [
  { label: 'Home', to: '/jugar' },
  { label: 'Jugar', to: '/jugar' },
  { label: 'Torneos', to: '/torneos' },
  { label: 'Quedadas', to: '/quedadas' },
];

// ========== COMPONENTE PRINCIPAL ==========

const Navbar: React.FC = (): React.JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

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


      <Link to="/tienda" className="navbar__shop-btn" title="Tienda">
        <ShopIcon />
      </Link>

        <button className="navbar__lang">
          ES
          <ChevronDownIcon />
        </button>
      


        {isLoggedIn ? (
          <div className="navbar__profile">
            <Link to="/perfil" className="navbar__profile-link" title={username}>
              <div className="navbar__profile-avatar">
                <UserAvatarIcon />
              </div>
              <span className="navbar__profile-name">{username || 'Perfil'}</span>
            </Link>
            <button 
              className="navbar__logout-btn" 
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <Link to="/login" className="navbar__login-btn">Login</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;