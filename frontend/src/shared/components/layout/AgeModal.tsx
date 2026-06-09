import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface AgeModalProps {
  isOpen: boolean;
  birthDateInput: string;
  onBirthDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isSubmitting: boolean;
}

export const AgeModal: React.FC<AgeModalProps> = ({
  isOpen,
  birthDateInput,
  onBirthDateChange,
  onSubmit,
  error,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <div className="settings-modal-overlay age-modal-overlay">
      <div className="settings-modal age-modal">
        <h2 className="age-modal__title">
          🎂 {t('login.agePromptTitle')}
        </h2>
        <p className="age-modal__desc">
          {t('login.agePromptDesc')}
        </p>
        <form onSubmit={onSubmit}>
          <input
            type="date"
            className="settings-select age-modal__input"
            value={birthDateInput}
            onChange={(e) => onBirthDateChange(e.target.value)}
            disabled={isSubmitting}
            required
          />
          {error && (
            <p className="age-modal__error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="settings-save-btn age-modal__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('login.agePromptSubmit')}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
