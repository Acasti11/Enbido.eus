import React, { useState } from 'react';
import api from '../../../services/api';
import './login-form.css';

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

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/usuarios/login', {
        username,
        password
      });
      
      // Guardar el usuario y recargar la página para que App.tsx lea la sesión
      localStorage.setItem('user', JSON.stringify(response.data));
      window.location.reload(); 
      
    } catch (err: any) {
      setError(err.response?.data || 'Error al iniciar sesión');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__field">
        <label className="login-form__label">User or Email</label>
        <div className="login-form__input-wrapper">
          <UserIcon />
          <input
            type="text"
            className="login-form__input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Introduce: juanito"
            required
          />
        </div>
      </div>
      <div className="login-form__field">
        <div className="login-form__label-row">
          <label className="login-form__label">Password</label>
          <a href="#" className="login-form__forgot">Forgot password?</a>
        </div>
        <div className="login-form__input-wrapper">
          <LockIcon />
          <input
            type={showPassword ? 'text' : 'password'}
            className="login-form__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Introduce: 1234"
            required
          />
          <button type="button" className="login-form__toggle" onClick={() => setShowPassword(!showPassword)}>
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      {error && <p className="login-form__error">{error}</p>}

      <button type="submit" className="login-form__submit">
        Jugar ahora
      </button>
    </form>
  );
};

export default LoginForm;