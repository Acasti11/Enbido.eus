import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css'

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'eus', label: 'EUS' },
];

const LanguageSwitcher: React.FC = (): React.JSX.Element => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLanguage = i18n.language || 'es';

  const handleToggle = (): void => {
    setIsOpen((prev) => !prev);
  };

  const handleChangeLanguage = (langCode: string): void => {
    if (langCode === currentLanguage) return;
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent): void => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeLabel = LANGUAGE_OPTIONS.find(
    (lang) => currentLanguage.startsWith(lang.code)
  )?.label || 'ES';

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('nav.selectLanguage')}
      >
        <span className="language-switcher__current">{activeLabel}</span>
        <svg
          className={`language-switcher__arrow ${isOpen ? 'language-switcher__arrow--open' : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul className="language-switcher__dropdown" role="listbox" aria-label={t('nav.availableLanguages')}>
          {LANGUAGE_OPTIONS.map((lang) => {
            const isActive = currentLanguage.startsWith(lang.code);
            return (
              <li key={lang.code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`language-switcher__option ${isActive ? 'language-switcher__option--active' : ''}`}
                  onClick={() => handleChangeLanguage(lang.code)}
                >
                  <span className="language-switcher__option-code">{lang.label}</span>
                  {isActive && (
                    <svg className="language-switcher__check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
