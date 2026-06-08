import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/bottom-features.css';

interface FeatureItemProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }): React.JSX.Element => (
  <div className="bottom-features__item">
    <div className="bottom-features__icon">{icon}</div>
    <div>
      <h2 className="bottom-features__title">{title}</h2>
      <p className="bottom-features__desc">{description}</p>
    </div>
  </div>
);

const BottomFeatures: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="bottom-features">
      <section className="bottom-features__container">
        <FeatureItem
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>}
          title={t('common.featuresPlayTitle')}
          description={t('common.featuresPlayDesc')}
        />
        <FeatureItem
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>}
          title={t('common.featuresCompeteTitle')}
          description={t('common.featuresCompeteDesc')}
        />
        <FeatureItem
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
          title={t('common.featuresAnalysisTitle')}
          description={t('common.featuresAnalysisDesc')}
        />
        <FeatureItem
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
          title={t('common.featuresCommunityTitle')}
          description={t('common.featuresCommunityDesc')}
        />
      </section>
    </div>
  );
};

export default BottomFeatures;
