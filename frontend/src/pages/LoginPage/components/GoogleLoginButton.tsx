import React, { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import '../styles/login-form.css';

interface GoogleAuthResponse {
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

const GoogleLoginButton: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setError('');

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        setError(t('login.googleError'));
        setIsLoading(false);
        return;
      }

      // Backend sets HttpOnly cookies automatically via withCredentials
      await api.post<GoogleAuthResponse>('/auth/google', {
        idToken,
      });

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
      } else if (status === 500) {
        msg = t('login.serverError') || 'Server error. Please try again later.';
      } else if (typeof data === 'object' && data !== null && typeof data.error === 'string') {
        msg = data.error;
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError(t('login.googleError'));
    setIsLoading(false);
  };

  return (
    <div className="google-login-container" style={{ marginTop: '16px' }}>
      {isLoading && (
        <div className="google-login-loading" style={{ textAlign: 'center', marginBottom: '12px' }}>
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
      )}

      {!isLoading && (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          theme="filled_black"
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
        />
      )}

      {error && (
        <p
          className="login-form__error"
          style={{ textAlign: 'center', marginTop: '12px' }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleLoginButton;
