import React from 'react';
import './navbar.css';

const NAV_LINKS = [
  { label: 'Play', href: '#' },
  { label: 'Learn', href: '#' },
  { label: 'Ranking', href: '#' },
  { label: 'Community', href: '#' },
];

const renderNavLinks = (): React.JSX.Element[] => {
  return NAV_LINKS.map((link) => (
    <a key={link.label} href={link.href} className="navbar__link">
      {link.label}
    </a>
  ));
};

const Navbar: React.FC = (): React.JSX.Element => {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <div className="navbar__logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <span className="navbar__title">ENBIDO</span>
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
        <button className="navbar__login-btn">Access</button>
      </div>
    </header>
  );
};

export default Navbar;