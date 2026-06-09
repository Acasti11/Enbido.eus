import React from 'react';

const getOrientationText = (lang: string) => {
  const isBasque = lang === 'eu' || lang.startsWith('eu') || lang === 'eus';
  const isFrench = lang === 'fr' || lang.startsWith('fr');
  if (isBasque) {
    return {
      title: 'Orientazio horizontala behar da',
      subtitle: 'Mesedez, biratu gailua zeharka Mus-era jolasteko.'
    };
  }
  if (isFrench) {
    return {
      title: 'Orientation paysage requise',
      subtitle: 'Veuillez pivoter votre appareil pour jouer au Mus.'
    };
  }
  if (lang === 'en' || lang.startsWith('en')) {
    return {
      title: 'Landscape Mode Required',
      subtitle: 'Please tilt your device to landscape orientation to play Mus.'
    };
  }
  return {
    title: 'Orientación Horizontal Requerida',
    subtitle: 'Por favor, inclina tu pantalla en horizontal para jugar al Mus.'
  };
};

export const OrientationOverlay: React.FC<{ lang: string }> = ({ lang }) => {
  const texts = getOrientationText(lang);
  return (
    <div className="orientation-overlay">
      <div className="orientation-overlay__content">
        <div className="orientation-overlay__phone-wrapper">
          <svg className="orientation-overlay__phone-svg" viewBox="0 0 100 100" width="120" height="120">
            <rect className="phone-rect" x="35" y="15" width="30" height="60" rx="5" ry="5" fill="none" stroke="var(--color-gold)" strokeWidth="3" />
            <circle className="phone-button" cx="50" cy="70" r="2" fill="var(--color-gold)" />
            <path className="rotate-arrow" d="M25 45 A 25 25 0 0 1 75 45" fill="none" stroke="var(--color-text-white)" strokeWidth="3" strokeDasharray="5,5" />
            <polygon className="rotate-arrow-head" points="75,45 70,38 80,38" fill="var(--color-text-white)" />
          </svg>
        </div>
        <h2 className="orientation-overlay__title">{texts.title}</h2>
        <p className="orientation-overlay__subtitle">{texts.subtitle}</p>
      </div>
    </div>
  );
};
