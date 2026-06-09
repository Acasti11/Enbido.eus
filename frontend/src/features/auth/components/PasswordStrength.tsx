import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Circle } from 'lucide-react';
import { usePasswordValidation } from '@/shared/hooks/usePasswordValidation';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  attemptedSubmit?: boolean;
}

const STRENGTH_COLORS = [
  'bg-gray-300',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
];

const STRENGTH_TEXT_COLORS = [
  'text-gray-400',
  'text-red-500',
  'text-orange-500',
  'text-yellow-600',
  'text-green-600',
];

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRequirements = true,
  attemptedSubmit = false,
}): React.JSX.Element => {
  const { t } = useTranslation();
  const validation = usePasswordValidation(password);

  const requirements = [
    { key: 'minLength', label: t('register.password.requirements.minLength'), met: validation.isMinLength },
    { key: 'uppercase', label: t('register.password.requirements.uppercase'), met: validation.hasUppercase },
    { key: 'lowercase', label: t('register.password.requirements.lowercase'), met: validation.hasLowercase },
    { key: 'number', label: t('register.password.requirements.number'), met: validation.hasNumber },
    { key: 'specialChar', label: t('register.password.requirements.specialChar'), met: validation.hasSpecialChar },
  ];

  return (
    <div className="password-strength">
      {/* Segmented strength bar */}
      <div className="password-strength__bar">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`password-strength__segment ${
              index < validation.strength ? STRENGTH_COLORS[validation.strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className="password-strength__label">
        <span className={STRENGTH_TEXT_COLORS[validation.strength]}>
          {t(`register.password.strength.${validation.strengthLabel}`)}
        </span>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="password-strength__checklist">
          {requirements.map((req) => (
            <div
              key={req.key}
              className={`password-strength__item ${
                req.met
                  ? 'password-strength__item--met'
                  : attemptedSubmit
                  ? 'password-strength__item--unmet'
                  : 'password-strength__item--pending'
              }`}
            >
              {req.met ? (
                <Check className="password-strength__icon password-strength__icon--check" size={14} />
              ) : attemptedSubmit ? (
                <X className="password-strength__icon password-strength__icon--cross" size={14} />
              ) : (
                <Circle className="password-strength__icon password-strength__icon--circle" size={14} />
              )}
              <span className="password-strength__text">{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
