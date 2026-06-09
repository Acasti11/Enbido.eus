import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { UseLoginFormReturn } from '../hooks/useLoginForm';

interface TwoFactorFormProps {
  form: UseLoginFormReturn;
}

const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ form }): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    verificationCode,
    setVerificationCode,
    countdown,
    twoFactorError,
    isLoading,
    handleVerify2Fa,
    handleBack,
    formatTime,
  } = form;

  return (
    <form className="auth-form" onSubmit={handleVerify2Fa}>
      <div className="auth-2fa">
        <h2 className="auth-2fa__title">🔑 {t('login.twoFactorTitle')}</h2>
        <p className="auth-2fa__description">{t('login.twoFactorDescription')}</p>

        <div className="auth-input__wrapper">
          <input
            type="text"
            className="auth-input auth-input--2fa"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
            placeholder="000000"
            required
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div className="auth-2fa__timer">
          {countdown > 0 ? (
            <span>
              {t('login.codeExpiresIn')}:{' '}
              <strong className="auth-2fa__timer--highlight">{formatTime(countdown)}</strong>
            </span>
          ) : (
            <strong className="auth-2fa__timer--expired">⚠️ {t('login.codeExpired')}</strong>
          )}
        </div>

        {twoFactorError && (
          <div className="auth-alert auth-alert--error auth-alert--center">
            <AlertCircle size={16} />
            <span>{twoFactorError}</span>
          </div>
        )}

        <div className="auth-2fa__actions">
          <button
            type="button"
            className="auth-submit auth-submit--secondary"
            onClick={handleBack}
            disabled={isLoading}
          >
            {t('common.back')}
          </button>
          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading || countdown <= 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="auth-spinner" size={18} />
                {t('common.loading')}
              </>
            ) : (
              t('login.verifyAndEnter')
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TwoFactorForm;
