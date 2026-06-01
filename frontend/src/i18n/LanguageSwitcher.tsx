import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

const LanguageSwitcher: React.FC = (): React.JSX.Element => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'es';

  const handleChangeLanguage = (langCode: string): void => {
    if (langCode === currentLanguage) return;
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="language-switcher" role="group" aria-label="Language selector">
      {LANGUAGE_OPTIONS.map((lang) => {
        const isActive = currentLanguage.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            type="button"
            className={`language-switcher__btn ${isActive ? 'language-switcher__btn--active' : ''}`}
            onClick={() => handleChangeLanguage(lang.code)}
            aria-pressed={isActive}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
