import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { NavLinkItem } from './navbarTypes';

interface NavLinksProps {
  links: NavLinkItem[];
  onClick?: () => void;
  variant?: 'desktop' | 'drawer';
}

export const NavLinks: React.FC<NavLinksProps> = ({ links, onClick, variant = 'desktop' }) => {
  const location = useLocation();
  const isDrawer = variant === 'drawer';

  return (
    <>
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        const className = isDrawer
          ? `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`
          : `navbar__link ${isActive ? 'navbar__link--active' : ''}`;

        return (
          <Link
            key={link.to}
            to={link.to}
            className={className}
            onClick={onClick}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
};

export const useNavLinks = (): NavLinkItem[] => {
  const { t } = useTranslation();

  return [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.play'), to: '/jugar' },
    { label: t('nav.tournaments'), to: '/torneos' },
    { label: t('nav.meetups'), to: '/quedadas' },
  ];
};
