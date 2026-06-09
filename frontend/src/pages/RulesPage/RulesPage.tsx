import React from 'react';
import './rules.css';
import { useTranslation } from 'react-i18next';
import { useSeo } from '@/shared/hooks/useSeo';

const useRulesSeo = () => {
  useSeo({
    title: 'Reglas del Mus: Cómo Jugar, Señas y Variantes | Enbido',
    description: 'Guía oficial del reglamento del Mus. Aprende las señas permitidas, los 4 lances (Grande, Chica, Pares, Juego) y diferencias entre 4 Reyes y 8 Reyes.',
    keywords: 'reglas del mus, como jugar al mus, senas del mus, variantes del mus, 8 reyes, 4 reyes, mus euskadi',
    canonical: 'https://enbido.eus/reglas',
    ogImage: 'https://enbido.eus/home-image-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': '¿Qué es la variante de 8 reyes en el Mus?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Es la modalidad más jugada en Vizcaya y Guipúzcoa. Los Treses equivalen a Reyes, y los Dues equivalen a Ases. Esto hace que haya 8 Reyes y 8 Ases en la baraja, provocando muchas más manos con parejas altas y agilizando la partida.'
          }
        },
        {
          '@type': 'Question',
          'name': '¿Cuáles son los 4 lances del Mus?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Cada mano de Mus consta de 4 lances consecutivos: Grande (Handia), Chica (Txikia), Pares (Pareak), y Juego o Punto (Jokoa edo Puntua).'
          }
        }
      ]
    }
  });
};

const RulesHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <header className="rules-header">
      <h1 className="rules-title">{t('rules.title')}</h1>
      <span className="rules-subtitle">{t('rules.subtitle')}</span>
    </header>
  );
};

const RulesIntroSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="rules-section" aria-labelledby="intro-title">
      <h2 id="intro-title" className="rules-section-title">
        <span>🃏</span> {t('rules.whatIsMus')}
      </h2>
      <p className="rules-intro-text">{t('rules.intro1')}</p>
      <p className="rules-intro-text">{t('rules.intro2')}</p>
    </section>
  );
};

interface LanceCardProps {
  num: string;
  titleKey: string;
  descKey: string;
  children?: React.ReactNode;
}

const LanceCard: React.FC<LanceCardProps> = ({ num, titleKey, descKey, children }): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <div className="lance-card">
      <div className="lance-num">{num}</div>
      <h3 className="lance-title">{t(titleKey)}</h3>
      <p className="lance-desc">{t(descKey)}</p>
      {children}
    </div>
  );
};

const RulesLancesSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="rules-section" aria-labelledby="lances-title">
      <h2 id="lances-title" className="rules-section-title">
        <span>⚔️</span> {t('rules.lancesTitle')}
      </h2>
      <p className="rules-intro-text">{t('rules.lancesIntro')}</p>
      <div className="lances-grid">
        <LanceCard num="1" titleKey="rules.grandeTitle" descKey="rules.grandeDesc" />
        <LanceCard num="2" titleKey="rules.chicaTitle" descKey="rules.chicaDesc" />
        <LanceCard num="3" titleKey="rules.paresTitle" descKey="rules.paresDesc">
          <ul className="lance-sublist">
            <li><strong>{t('rules.par')}</strong></li>
            <li><strong>{t('rules.medias')}</strong></li>
            <li><strong>{t('rules.duples')}</strong></li>
          </ul>
        </LanceCard>
        <LanceCard num="4" titleKey="rules.juegoTitle" descKey="rules.juegoDesc" />
      </div>
    </section>
  );
};

interface SignCardProps {
  emoji: string;
  nameKey: string;
  meaningKey: string;
  descKey: string;
}

const SignCard: React.FC<SignCardProps> = ({ emoji, nameKey, meaningKey, descKey }): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <div className="sena-card">
      <span className="sena-emoji">{emoji}</span>
      <div className="sena-info">
        <span className="sena-name">{t(nameKey)}</span>
        <span className="sena-meaning">{t(meaningKey)}</span>
        <span className="sena-desc">{t(descKey)}</span>
      </div>
    </div>
  );
};

const RulesSignsSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="rules-section" aria-labelledby="signs-title">
      <h2 id="signs-title" className="rules-section-title">
        <span>🤫</span> {t('rules.signsTitle')}
      </h2>
      <p className="rules-intro-text">{t('rules.signsIntro')}</p>
      <div className="senas-grid">
        <SignCard emoji="👄" nameKey="rules.signReyesName" meaningKey="rules.signReyesMeaning" descKey="rules.signReyesDesc" />
        <SignCard emoji="👅" nameKey="rules.signAsesName" meaningKey="rules.signAsesMeaning" descKey="rules.signAsesDesc" />
        <SignCard emoji="😉" nameKey="rules.signMediasName" meaningKey="rules.signMediasMeaning" descKey="rules.signMediasDesc" />
        <SignCard emoji="🤨" nameKey="rules.signDuplesName" meaningKey="rules.signDuplesMeaning" descKey="rules.signDuplesDesc" />
        <SignCard emoji="🤫" nameKey="rules.sign31Name" meaningKey="rules.sign31Meaning" descKey="rules.sign31Desc" />
        <SignCard emoji="😑" nameKey="rules.signCiegoName" meaningKey="rules.signCiegoMeaning" descKey="rules.signCiegoDesc" />
      </div>
    </section>
  );
};

const RulesVariationsSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="rules-section" aria-labelledby="variations-title">
      <h2 id="variations-title" className="rules-section-title">
        <span>⚙️</span> {t('rules.variationsTitle')}
      </h2>
      <div className="variations-box">
        <div className="variation-item">
          <span className="variation-title">{t('rules.8reyesTitle')}</span>
          <p className="variation-desc">{t('rules.8reyesDesc')}</p>
        </div>
        <div className="variation-item variation-item--secondary">
          <span className="variation-title">{t('rules.4reyesTitle')}</span>
          <p className="variation-desc">{t('rules.4reyesDesc')}</p>
        </div>
      </div>
    </section>
  );
};

const RulesPage: React.FC = (): React.JSX.Element => {
  useRulesSeo();

  return (
    <div className="rules-container">
      <RulesHeader />
      <RulesIntroSection />
      <RulesLancesSection />
      <RulesSignsSection />
      <RulesVariationsSection />
    </div>
  );
};

export default RulesPage;
