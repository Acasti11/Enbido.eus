import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import TwoFactorForm from './TwoFactorForm';
import './auth-forms.css';

interface LoginFormProps {
  onSwitchToRecover: () => void;
  on2FaStatusChange?: (isActive: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRecover, on2FaStatusChange }): React.JSX.Element => {
  const { t } = useTranslation();
  const form = useLoginForm({ on2FaStatusChange });

  const {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loginError,
    isLoading,
    fieldErrors,
    setFieldErrors,
    setLoginError,
    twoFactorRequired,
    handleSubmit,
    getInputWrapperClass,
  } = form;

  if (twoFactorRequired) {
    return <TwoFactorForm form={form} />;
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Username / Email */}
      <div className="auth-field">
        <label className="auth-label">{t('login.usernameOrEmail')}</label>
        <div className={getInputWrapperClass(!!fieldErrors.username)}>
          <User className="auth-input__icon" size={18} />
          <input
            type="text"
            className={`auth-input ${fieldErrors.username ? 'auth-input--error' : ''}`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined }));
              if (loginError) setLoginError(null);
            }}
            placeholder={t('login.placeholderUsername')}
            disabled={isLoading}
          />
          {fieldErrors.username && <AlertCircle className="auth-input__status auth-input__status--error" size={18} />}
        </div>
        {fieldErrors.username && <span className="auth-field__error">{fieldErrors.username}</span>}
      </div>

      {/* Password */}
      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label">{t('login.password')}</label>
          <button type="button" className="auth-link auth-link--small" onClick={onSwitchToRecover}>
            {t('login.forgotPassword')}
          </button>
        </div>
        <div className={getInputWrapperClass(!!fieldErrors.password)}>
          <Lock className="auth-input__icon" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            className={`auth-input ${fieldErrors.password ? 'auth-input--error' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              if (loginError) setLoginError(null);
            }}
            placeholder={t('login.placeholderPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            className="auth-input__toggle"
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {fieldErrors.password && <AlertCircle className="auth-input__status auth-input__status--error" size={18} />}
        </div>
        {fieldErrors.password && <span className="auth-field__error">{fieldErrors.password}</span>}
      </div>

      {/* Auth errors */}
      {loginError && (
        <div className="auth-alert auth-alert--error">
          <AlertCircle size={16} />
          <div className="auth-alert__content">
            <span>{loginError.message}</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button type="submit" className="auth-submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="auth-spinner" size={18} />
            {t('common.loading')}
          </>
        ) : (
          t('login.submit')
        )}
      </button>
    </form>
  );
};

export default LoginForm;
