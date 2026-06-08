import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './auth-forms.css';

interface LoginFormProps {
  onSwitchToRecover: () => void;
  on2FaStatusChange?: (isActive: boolean) => void;
}

interface LoginError {
  type: 'invalidCredentials' | 'accountNotFound' | 'tooManyAttempts' | 'accountLocked' | 'generic';
  message: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRecover, on2FaStatusChange }): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  // Two-factor auth states
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [twoFactorError, setTwoFactorError] = useState('');

  useEffect(() => {
    if (on2FaStatusChange) {
      on2FaStatusChange(twoFactorRequired);
    }
  }, [twoFactorRequired, on2FaStatusChange]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (twoFactorRequired && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoFactorRequired, countdown]);

  const getErrorFromResponse = (err: unknown): LoginError => {
    const axiosError = err as {
      response?: {
        status?: number;
        data?: Record<string, unknown> | string;
      };
    };
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    const rawMessage =
      (typeof data === 'object' && data !== null && typeof data.error === 'string'
        ? data.error
        : undefined) ||
      (typeof data === 'object' && data !== null && typeof data.message === 'string'
        ? data.message
        : undefined) ||
      (typeof data === 'string' ? data : '');

    const msgLower = rawMessage.toLowerCase();

    if (status === 429 || msgLower.includes('too many') || msgLower.includes('rate limit')) {
      return { type: 'tooManyAttempts', message: t('login.error.tooManyAttempts') };
    }
    if (status === 403 || msgLower.includes('locked') || msgLower.includes('bloqueada') || msgLower.includes('bloqueado')) {
      return { type: 'accountLocked', message: t('login.error.accountLocked') };
    }
    if (status === 404 || msgLower.includes('not found') || msgLower.includes('no existe') || msgLower.includes('ez da existitzen')) {
      return { type: 'accountNotFound', message: t('login.error.accountNotFound') };
    }
    if (status === 401 || msgLower.includes('invalid') || msgLower.includes('incorrect') || msgLower.includes('wrong')) {
      return { type: 'invalidCredentials', message: t('login.error.invalidCredentials') };
    }

    return { type: 'generic', message: rawMessage || t('login.errorLogin') };
  };

  const validateFields = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = t('login.error.usernameRequired');
    if (!password) errors.password = t('login.error.passwordRequired');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setFieldErrors({});

    if (!validateFields()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/usuarios/login', {
        username,
        password,
      });

      const { twoFactorRequired: requires2Fa, tempUserId: userId } = response.data;

      if (requires2Fa) {
        setTempUserId(userId);
        setTwoFactorRequired(true);
        setCountdown(300);
        setVerificationCode('');
        setIsLoading(false);
        return;
      }

      // Cookies are set by backend automatically
      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');
    } catch (err: unknown) {
      const error = getErrorFromResponse(err);
      setLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');

    if (verificationCode.length !== 6) {
      setTwoFactorError(t('login.invalidCode'));
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/usuarios/login/verify-2fa', {
        userId: tempUserId,
        code: verificationCode.trim(),
      });

      // Cookies are set by backend automatically
      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, unknown> | string } };
      const data = axiosError.response?.data;
      const msg =
        (typeof data === 'object' && data !== null && typeof data.error === 'string'
          ? data.error
          : undefined) ||
        (typeof data === 'object' && data !== null && typeof data.message === 'string'
          ? data.message
          : undefined) ||
        t('login.wrongCode');
      setTwoFactorError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleBack = () => {
    setTwoFactorRequired(false);
    setVerificationCode('');
    setTwoFactorError('');
  };

  const getInputWrapperClass = (hasError: boolean): string => {
    if (hasError) return 'auth-input__wrapper auth-input__wrapper--error animate-shake';
    return 'auth-input__wrapper';
  };

  // Two-factor form
  if (twoFactorRequired) {
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
  }

  // Normal login form
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
