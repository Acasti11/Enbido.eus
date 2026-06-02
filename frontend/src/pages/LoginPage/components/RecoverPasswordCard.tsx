import React, { useState } from 'react';
import CardLogo from './CardLogo';
import api from '../../../services/api';
import '../styles/login-card.css';
import '../styles/login-form.css';

interface RecoverPasswordCardProps {
  onSwitchToLogin: () => void;
}

const MailIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const RecoverPasswordCard: React.FC<RecoverPasswordCardProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Construir dinámicamente la URL base de redirección del frontend para restablecer la contraseña
    const protocol = window.location.protocol;
    const host = window.location.host; // Incluye puerto
    const frontendUrl = `${protocol}//${host}/recuperar-password`;

    try {
      const response = await api.post('/usuarios/login/recover-password', {
        email: email.trim(),
        frontendUrl
      });
      setSuccessMsg(response.data.message || 'Se ha enviado un correo electrónico con instrucciones.');
      setEmail('');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al procesar la solicitud.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-card__header">
        <CardLogo />
        <h1 className="login-card__title">ENBIDO</h1>
        <p className="login-card__subtitle">Recuperar cuenta / Kontua berreskuratu</p>
      </div>

      {successMsg ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div 
            style={{ 
              fontSize: '48px', 
              marginBottom: '15px', 
              color: '#d4af37',
              animation: 'pulse 2s infinite' 
            }}
          >
            ✉️
          </div>
          <p 
            style={{ 
              color: 'var(--color-brand-dark)', 
              fontWeight: 600, 
              fontSize: '15px', 
              lineHeight: '1.5',
              marginBottom: '25px' 
            }}
          >
            {successMsg}
          </p>
          <button 
            onClick={onSwitchToLogin} 
            className="login-form__submit"
            style={{ marginTop: 0 }}
          >
            Volver al Login / Saioa hasi
          </button>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__field">
            <label className="login-form__label">
              Correo Electrónico / Posta Elektronikoa
            </label>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '-4px', marginBottom: '8px' }}>
              Te enviaremos un email con un enlace para restablecer tu contraseña.
            </p>
            <div className="login-form__input-wrapper">
              <MailIcon />
              <input
                type="email"
                className="login-form__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {errorMsg && (
            <p className="login-form__error" style={{ textAlign: 'center', marginTop: '5px' }}>
              ⚠️ {errorMsg}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="login-form__submit" 
              style={{ 
                background: 'rgba(0,0,0,0.03)', 
                color: 'var(--color-brand-dark)', 
                border: '1px solid var(--color-card-border)',
                boxShadow: 'none'
              }}
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="login-form__submit"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? (
                <div 
                  className="loading-spinner" 
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
              ) : (
                'Enviar correo'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecoverPasswordCard;
