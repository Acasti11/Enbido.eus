import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CardLogo from '../LoginPage/components/CardLogo';
import BackgroundCards from '../LoginPage/components/BackgroundCards';
import api from '../../services/api';
import '../LoginPage/styles/login-card.css';
import '../LoginPage/styles/login-form.css';
import './reset-password.css';

const KeyIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
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

const ResetPasswordPage: React.FC = (): React.JSX.Element => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Token de recuperación ausente o no válido.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/usuarios/login/reset-password', {
        token: token.trim(),
        newPassword: password.trim()
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al cambiar la contraseña. Comprueba que el enlace no haya expirado.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <BackgroundCards />

      <div className="reset-password-page__main">
        <div className="login-card">
          <div className="login-card__header">
            <CardLogo />
            <h1 className="login-card__title">ENBIDO</h1>
            <p className="login-card__subtitle">Nueva Contraseña / Pasahitz Berria</p>
          </div>

          {!token ? (
            <div className="reset-success-box">
              <div className="reset-success-box__icon" style={{ color: 'var(--color-accent-red)' }}>⚠️</div>
              <h2 className="reset-success-box__title">Enlace no válido</h2>
              <p className="reset-success-box__text">
                Falta el token de seguridad o este no es válido. Por favor, solicita un nuevo enlace de recuperación desde la pantalla de inicio de sesión.
              </p>
              <button onClick={() => navigate('/login')} className="login-form__submit">
                Ir al Login / Saioa hasi
              </button>
            </div>
          ) : success ? (
            <div className="reset-success-box">
              <div className="reset-success-box__icon">🏆</div>
              <h2 className="reset-success-box__title">¡Contraseña Cambiada!</h2>
              <p className="reset-success-box__text">
                Tu contraseña ha sido restablecida con éxito. Ya puedes volver a conectarte a la mesa de Mus con tus nuevas credenciales.
              </p>
              <button onClick={() => navigate('/login')} className="login-form__submit">
                Entrar a jugar / Saioa hasi
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '10px', lineHeight: '1.4' }}>
                Estás restableciendo tu contraseña de forma segura. Introduce y confirma tu nueva clave de acceso.
              </p>

              <div className="login-form__field">
                <label className="login-form__label">Nueva Contraseña / Pasahitz Berria</label>
                <div className="login-form__input-wrapper">
                  <KeyIcon />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-form__input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduce contraseña"
                    required
                    disabled={loading}
                  />
                  <button type="button" className="login-form__toggle" onClick={() => setShowPassword(!showPassword)}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="login-form__field">
                <label className="login-form__label">Confirmar Contraseña / Pasahitza ziurtatu</label>
                <div className="login-form__input-wrapper">
                  <KeyIcon />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-form__input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="login-form__error" style={{ textAlign: 'center' }}>
                  ⚠️ {errorMsg}
                </p>
              )}

              <button 
                type="submit" 
                className="login-form__submit"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <span className="loading-spinner" />
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
