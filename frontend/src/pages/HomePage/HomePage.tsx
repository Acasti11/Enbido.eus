import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './homepage.css';
import { useSeo } from '@/shared/hooks/useSeo';
import {
  PlayIcon,
  TrophyIcon,
  MapPinIcon,
  ShopBagIcon,
  CardsIcon,
  UserPlusIcon,
  GameControllerIcon,
  CrownIcon,
} from './components/HomeIcons';

// ========== SUB-COMPONENTS ==========

const HeroCtaPane: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="home-cta-pane">
      <h1 className="home-title">
        {t('home.title')}
        <span>{t('home.titleSub')}</span>
      </h1>
      <p className="home-subtitle">{t('home.subtitle')}</p>
      <div className="home-buttons-box">
        <button
          className="btn-play-primary"
          onClick={() => navigate('/jugar')}
          title={t('home.playNowTitle')}
        >
          <PlayIcon />
          {t('home.playNow')}
        </button>
        <button
          className="btn-tournaments-secondary"
          onClick={() => navigate('/torneos')}
          title={t('home.joinTournamentsTitle')}
        >
          <TrophyIcon />
          {t('home.joinTournaments')}
        </button>
        <button
          className="btn-meetups-outline"
          onClick={() => navigate('/quedadas')}
          title={t('home.findMeetupsTitle')}
        >
          <MapPinIcon />
          {t('home.findMeetups')}
        </button>
      </div>
    </div>
  );
};

const HeroVisualPane: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="home-visual-pane">
      <img
        src="/home-image-mus.png"
        alt={t('home.heroImageAlt')}
        className="home-hero-img"
      />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, titleKey, descKey, onClick }) => {
  const { t } = useTranslation();
  return (
    <div className="home-feature-card" onClick={onClick}>
      <div className="home-feature-icon">{icon}</div>
      <h2 className="home-feature-title">{t(titleKey)}</h2>
      <p className="home-feature-desc">{t(descKey)}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="home-features-section" aria-label={t('home.featuresSectionAriaLabel')}>
      <FeatureCard
        icon={<CardsIcon />}
        titleKey="home.featurePlay"
        descKey="home.featurePlayDesc"
        onClick={() => navigate('/jugar')}
      />
      <FeatureCard
        icon={<TrophyIcon />}
        titleKey="home.featureTournaments"
        descKey="home.featureTournamentsDesc"
        onClick={() => navigate('/torneos')}
      />
      <FeatureCard
        icon={<MapPinIcon />}
        titleKey="home.featureMeetups"
        descKey="home.featureMeetupsDesc"
        onClick={() => navigate('/quedadas')}
      />
    </section>
  );
};

interface HowToPlayCardProps {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const HowToPlayCard: React.FC<HowToPlayCardProps> = ({ icon, titleKey, descKey }) => {
  const { t } = useTranslation();
  return (
    <div className="home-step-card">
      <div className="home-step-icon">{icon}</div>
      <h2 className="home-step-title">{t(titleKey)}</h2>
      <p className="home-step-desc">{t(descKey)}</p>
    </div>
  );
};

const HowToPlaySection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="home-how-section" aria-label={t('home.howToPlayTitle')}>
      <h2 className="home-section-title">{t('home.howToPlayTitle')}</h2>
      <div className="home-steps-grid">
        <HowToPlayCard
          icon={<UserPlusIcon />}
          titleKey="home.step1Title"
          descKey="home.step1Desc"
        />
        <HowToPlayCard
          icon={<GameControllerIcon />}
          titleKey="home.step2Title"
          descKey="home.step2Desc"
        />
        <HowToPlayCard
          icon={<CrownIcon />}
          titleKey="home.step3Title"
          descKey="home.step3Desc"
        />
      </div>
    </section>
  );
};

const ShopBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="home-shop-banner">
      <div className="home-shop-text">
        <span className="home-shop-badge">{t('home.shopBadge')}</span>
        <h2 className="home-shop-title">{t('home.shopTitle')}</h2>
        <p className="home-shop-desc">{t('home.shopDesc')}</p>
      </div>
      <div className="home-shop-action">
        <button
          className="btn-shop-accent"
          onClick={() => navigate('/tienda')}
          title={t('home.goToShopTitle')}
        >
          <ShopBagIcon />
          {t('home.goToShop')}
        </button>
      </div>
    </section>
  );
};

const HomeFooter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="home-footer">
      <p>&copy; {currentYear} Enbido.eus. {t('home.footerRights')}</p>
      <div className="home-footer-links">
        <span className="home-footer-link" onClick={() => navigate('/jugar')}>
          {t('home.footerRules')}
        </span>
        <span className="home-footer-link" onClick={() => navigate('/torneos')}>
          {t('home.footerTournaments')}
        </span>
        <span className="home-footer-link" onClick={() => navigate('/quedadas')}>
          {t('home.footerMaps')}
        </span>
      </div>
    </footer>
  );
};

// ========== HOOKS ==========

const useHomeSeo = () => {
  const { t } = useTranslation();
  useSeo({
    title: t('Enbido'),
    description: t('home.seoDescription'),
    keywords: t('home.seoKeywords'),
    canonical: 'https://enbido.eus/',
    ogImage: 'https://enbido.eus/home-image-mus.png',
    lang: 'eu',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      'name': t('home.seoJsonLdName'),
      'url': 'https://enbido.eus/',
      'image': 'https://enbido.eus/home-image-mus.png',
      'description': t('home.seoDescription'),
      'genre': 'Card Game',
      'gamePlatform': 'Web Browser',
      'author': {
        '@type': 'Organization',
        'name': 'Enbido Team'
      }
    }
  });
};

// ========== MAIN COMPONENT ==========

const HomePage: React.FC = (): React.JSX.Element => {
  useHomeSeo();

  return (
    <div className="home-container">
      <section className="home-hero-section">
        <HeroVisualPane />
        <HeroCtaPane />
      </section>
      <FeaturesSection />
      <HowToPlaySection />
      <ShopBanner />
      <HomeFooter />
    </div>
  );
};

export default HomePage;
