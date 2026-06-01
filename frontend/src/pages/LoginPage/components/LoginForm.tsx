import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
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

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const decodeJwtPayload = (token: string): Record<string, string> => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
};

const handleLoginSubmit = async (
  username: string,
  password: string,
  setError: (msg: string) => void,
  navigate: ReturnType<typeof useNavigate>,
  t: TranslateFn
) => {
  try {
    const response = await api.post('/usuarios/login', { username, password });
    const { accessToken } = response.data;
    localStorage.setItem('token', accessToken);
    const payload = decodeJwtPayload(accessToken);
    localStorage.setItem('userId', payload.sub || '');
    localStorage.setItem('username', payload.username || '');
    localStorage.setItem('role', payload.role || '');
    navigate('/jugar');
  } catch (err) {
    const axiosError = err as AxiosError<{ error?: string }>;
    const msg = axiosError.response?.data?.error || axiosError.response?.data || t('login.errorLogin');
    setError(typeof msg === 'string' ? msg : t('login.errorLogin'));
  }
};

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  t: TranslateFn;
}

const UsernameField: React.FC<UsernameFieldProps> = ({ value, onChange, t }): React.JSX.Element => (
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

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  t: TranslateFn;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ value, onChange, showPassword, onToggleShow, t }): React.JSX.Element => (
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

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    handleLoginSubmit(username, password, setError, navigate, t);
  };

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <UsernameField value={username} onChange={setUsername} t={t} />
      <PasswordField value={password} onChange={setPassword} showPassword={showPassword} onToggleShow={() => setShowPassword(!showPassword)} t={t} />
      {error && <p className="login-form__error">{error}</p>}
      <button type="submit" className="login-form__submit">
        {t('login.submit')}
      </button>
    </form>
  );
};

export default LoginForm;
