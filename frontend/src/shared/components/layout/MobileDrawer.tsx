import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLinks } from './NavLinks';
import { ShopIcon } from './NavbarIcons';
import type { NavLinkItem } from './navbarTypes';

interface MobileDrawerProps {
  isOpen: boolean;
  links: NavLinkItem[];
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  links,
  onClose,
}) => {
  const { t } = useTranslation();

  return createPortal(
    <>
      <div className={`navbar__drawer ${isOpen ? 'navbar__drawer--open' : ''}`}>
        <div className="navbar__drawer-header">
          <span className="navbar__drawer-title">ENBIDO</span>
          <button
            className="navbar__drawer-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <nav className="navbar__drawer-nav">
          <NavLinks links={links} onClick={onClose} variant="drawer" />
        </nav>
        <div className="navbar__drawer-actions">
          <Link
            to="/tienda"
            className="navbar__drawer-action-btn"
            onClick={onClose}
          >
            <ShopIcon /> {t('nav.shop')}
          </Link>
        </div>
      </div>
      {isOpen && <div className="navbar__overlay" onClick={onClose} />}
    </>,
    document.body
  );
};
