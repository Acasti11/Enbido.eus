import React, { useState, useEffect } from 'react'; // ← Añadido useEffect
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import '../styles/login-form.css';

const UserIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

// UsernameField usa useTranslation internamente, NO recibe t como prop
interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const UsernameField: React.FC<UsernameFieldProps> = ({ value, onChange }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="login-form__field">
      <label className="login-form__label">{t('login.usernameOrEmail')}</label>
      <div className="login-form__input-wrapper">
        <UserIcon />
        <input
          type="text"
          className="login-form__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('login.placeholderUsername')}
          required
        />
      </div>
    </div>
  );
};

// PasswordField usa useTranslation internamente
interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ value, onChange, showPassword, onToggleShow }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="login-form__field">
      <div className="login-form__label-row">
        <label className="login-form__label">{t('login.password')}</label>
        <a href="#" className="login-form__forgot">{t('login.forgotPassword')}</a>
      </div>
      <div className="login-form__input-wrapper">
        <LockIcon />
        <input
          type={showPassword ? 'text' : 'password'}
          className="login-form__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('login.placeholderPassword')}
          required
        />
        <button type="button" className="login-form__toggle" onClick={onToggleShow}>
          <EyeIcon open={showPassword} />
        </button>
      </div>
    </div>
  );
};

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados de Doble Factor
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(300);

  // Manejar temporizador de expiración
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (twoFactorRequired && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoFactorRequired, countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/usuarios/login', {
        username,
        password
      });

      const { twoFactorRequired: requires2Fa, tempUserId: userId, accessToken } = response.data;

      if (requires2Fa) {
        setTempUserId(userId);
        setTwoFactorRequired(true);
        setCountdown(300);
        setVerificationCode('');
        return;
      }

      // Login directo sin 2FA
      localStorage.setItem('token', accessToken);
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      localStorage.setItem('userId', payload.sub);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('role', payload.role);

      console.log('Login directo exitoso. UserId:', payload.sub);
      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');

    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || 'Error al iniciar sesión';
      setError(msg);
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError(t('login.invalidCode')); // ← Usar traducción si existe
      return;
    }

    try {
      const response = await api.post('/usuarios/login/verify-2fa', {
        userId: tempUserId,
        code: verificationCode.trim()
      });

      const { accessToken } = response.data;
      localStorage.setItem('token', accessToken);

      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      localStorage.setItem('userId', payload.sub);
      localStorage.setItem('username', payload.username);
      localStorage.setItem('role', payload.role);

      console.log('Login con 2FA completado. UserId:', payload.sub);
      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || 'Código de seguridad incorrecto';
      setError(msg);
    }
  };

  // Formato del tiempo para 2FA
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (twoFactorRequired) {
    return (
      <form className="login-form" onSubmit={handleVerify2Fa}>
        <div className="login-form__field login-form__2fa-container">
          <h2 className="login-form__2fa-title">
            🔑 {t('login.twoFactorTitle')}
          </h2>
          <p className="login-form__2fa-description">
            {t('login.twoFactorDescription')}
          </p>

          <div className="login-form__input-wrapper login-form__2fa-input-wrapper">
            <input
              type="text"
              className="login-form__input login-form__2fa-input"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="000000"
              required
              autoFocus
            />
          </div>

          <div
            className={`login-form__2fa-timer ${countdown <= 0 ? 'login-form__2fa-timer--expired' : ''
              }`}
          >
            {countdown > 0 ? (
              <span>{t('login.codeExpiresIn')}: <strong className="login-form__2fa-highlight">{formatTime(countdown)}</strong></span>
            ) : (
              <strong>⚠️ {t('login.codeExpired')}</strong>
            )}
          </div>
        </div>

        {error && <p className="login-form__error login-form__error-center">{error}</p>}

        <div className="login-form__2fa-actions">
          <button
            type="button"
            className="login-form__submit login-form__2fa-back"
            onClick={() => {
              setTwoFactorRequired(false);
              setVerificationCode('');
              setError('');
            }}
          >
            {t('common.back')}
          </button>

          <button
            type="submit"
            className={`login-form__submit ${countdown <= 0 ? 'login-form__submit--disabled' : ''
              }`}>
            {t('login.verifyAndEnter')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <UsernameField value={username} onChange={setUsername} />
      <PasswordField value={password} onChange={setPassword} showPassword={showPassword} onToggleShow={() => setShowPassword(!showPassword)} />
      {error && <p className="login-form__error">{error}</p>}
      <button type="submit" className="login-form__submit">
        {t('login.submit')}
      </button>
    </form>
  );
};

export default LoginForm;