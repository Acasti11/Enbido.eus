import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './homepage.css';
import { useSeo } from '../../hooks/useSeo';

// ========== SVG ICON COMPONENTS ==========

const PlayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const TrophyIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v3.34a6 6 0 0 1-6 5.66 6 6 0 0 1-6-5.66V8a6 6 0 0 1 6-6Z" />
  </svg>
);

const MapPinIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ShopBagIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CardsIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="14" rx="2" ry="2" transform="rotate(-10 9 13)" />
    <rect x="6" y="4" width="14" height="14" rx="2" ry="2" transform="rotate(5 13 11)" />
  </svg>
);

const UserPlusIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const GameControllerIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="3" />
  </svg>
);

const CrownIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M5 20h14" />
  </svg>
);

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
      <h3 className="home-step-title">{t(titleKey)}</h3>
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

interface PodiumColumnProps {
  position: 1 | 2 | 3;
  username: string;
  elo: number;
  rankKey: string;
}

const PodiumColumn: React.FC<PodiumColumnProps> = ({ position, username, elo, rankKey }) => {
  const { t } = useTranslation();
  const getMedalEmoji = (pos: number) => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉');
  return (
    <div className={`home-podium-column position-${position}`}>
      <div className="home-podium-avatar">
        <span className="home-podium-medal">{getMedalEmoji(position)}</span>
        <div className={`home-podium-frame rank-${position}`} />
      </div>
      <div className="home-podium-details">
        <span className="home-podium-username">{username}</span>
        <span className="home-podium-elo">{elo} ELO</span>
        <span className="home-podium-rank">{t(rankKey)}</span>
      </div>
      <div className="home-podium-block">
        <span className="home-podium-number">{position}</span>
      </div>
    </div>
  );
};

const LeaderboardTeaser: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="home-leaderboard-teaser">
      <div className="home-leaderboard-teaser-header">
        <h2 className="home-section-title">{t('home.topPlayersTitle')}</h2>
        <p className="home-section-subtitle">{t('home.topPlayersDesc')}</p>
      </div>
      <div className="home-podium-container">
        <PodiumColumn position={2} username="AmaiaOrdago" elo={1980} rankKey="premiumLobby.rankExpert" />
        <PodiumColumn position={1} username="MikelMus" elo={2150} rankKey="premiumLobby.rankEnbidoMaisu" />
        <PodiumColumn position={3} username="AnderEnbido" elo={1850} rankKey="premiumLobby.rankExpert" />
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
      <LeaderboardTeaser />
      <ShopBanner />
      <HomeFooter />
    </div>
  );
};

export default HomePage;
