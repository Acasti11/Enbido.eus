import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './navbar.css';

const NAV_LINKS = [
  { label: 'Home', to: '/jugar' },
  { label: 'Jugar', to: '/jugar' },
  { label: 'Torneos', to: '/torneos' },
  { label: 'Quedadas', to: '/quedadas' },
];

const Navbar: React.FC = (): React.JSX.Element => {
  const location = useLocation();

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </Link>
        <Link to="/" className="navbar__title">ENBIDO</Link>
      </div>

      <nav className="navbar__nav">
        {renderNavLinks()}
      </nav>

      <div className="navbar__actions">
        <button className="navbar__lang">
          ES
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <Link to="/login" className="navbar__login-btn">Login</Link>
      </div>
    </header>
  );
};

export default Navbar;