import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from '../../../services/api';
import '../styles/login-form.css';

interface CreateUserFormProps {
  onSwitchToLogin: () => void;
}

interface GoogleAuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    surname?: string;
    username: string;
    role: string;
    profilePicture?: string;
  };
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    phoneNumber: '',
    postalCode: '',
    birthDate: '',
    username: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await api.post('/usuarios', formData);
      setSuccess(t('register.success'));
      setTimeout(() => onSwitchToLogin(), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, unknown> | string } };
      const data = axiosError.response?.data;
      const msg =
        (typeof data === 'object' && data !== null && typeof data.error === 'string'
          ? data.error
          : undefined) || t('register.error');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        setError(t('login.googleError'));
        setIsGoogleLoading(false);
        return;
      }

      const response = await api.post<GoogleAuthResponse>('/auth/google', {
        idToken,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('userId', String(payload.sub));
      localStorage.setItem('username', payload.username);
      localStorage.setItem('role', payload.role);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      if (user.profilePicture) {
        localStorage.setItem('userPicture', user.profilePicture);
      }

      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: Record<string, unknown> | string;
        };
      };
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      let msg = t('login.googleError');
      if (status === 401) {
        msg = t('login.googleInvalidToken') || 'Invalid Google token. Please try again.';
      } else if (status === 403) {
        msg = t('login.userBanned') || 'User is banned.';
      } else if (typeof data === 'object' && data !== null && typeof data.error === 'string') {
        msg = data.error;
      }

      setError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t('login.googleError'));
    setIsGoogleLoading(false);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '16px' }}>
        {t('register.title')}
      </h2>

      {/* Google Sign Up */}
      <div style={{ marginBottom: '16px' }}>
        {isGoogleLoading ? (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid #d4af37',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
              {t('login.validating')}...
            </p>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="filled_black"
            size="large"
            width="100%"
            text="signup_with"
            shape="rectangular"
          />
        )}
      </div>

      <div className="social-divider__row" style={{ marginBottom: '16px' }}>
        <div className="social-divider__line" />
        <span className="social-divider__text">{t('login.or')}</span>
        <div className="social-divider__line" />
      </div>

      {/* Traditional registration fields */}
      <div className="login-form__field">
        <label className="login-form__label">{t('register.name')}</label>
        <input
          type="text"
          name="name"
          className="login-form__input"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.surname')}</label>
        <input
          type="text"
          name="surname"
          className="login-form__input"
          value={formData.surname}
          onChange={handleChange}
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.username')}</label>
        <input
          type="text"
          name="username"
          className="login-form__input"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.email')}</label>
        <input
          type="email"
          name="email"
          className="login-form__input"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.password')}</label>
        <input
          type="password"
          name="password"
          className="login-form__input"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.phone')}</label>
        <input
          type="tel"
          name="phoneNumber"
          className="login-form__input"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.postalCode')}</label>
        <input
          type="text"
          name="postalCode"
          className="login-form__input"
          value={formData.postalCode}
          onChange={handleChange}
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label">{t('register.birthDate')}</label>
        <input
          type="date"
          name="birthDate"
          className="login-form__input"
          value={formData.birthDate}
          onChange={handleChange}
          required
        />
      </div>

      {error && <p className="login-form__error">{error}</p>}
      {success && (
        <p style={{ color: '#4ade80', textAlign: 'center', fontSize: '14px' }}>{success}</p>
      )}

      <button type="submit" className="login-form__submit" disabled={isLoading}>
        {isLoading ? t('register.loading') : t('register.submit')}
      </button>

      <button
        type="button"
        className="social-divider__register"
        onClick={onSwitchToLogin}
        style={{ marginTop: '12px', background: 'transparent' }}
      >
        {t('register.alreadyHaveAccount')}
      </button>
    </form>
  );
};

export default CreateUserForm;
