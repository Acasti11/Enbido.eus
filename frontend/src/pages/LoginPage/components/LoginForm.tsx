import React, { useState } from 'react';
import api from '../../../services/api';
import './login-form.css';

const LoginForm: React.FC = (): React.JSX.Element => {
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/usuarios/login', {
        username: formData.usuario,
        password: formData.password,
      });
      
      console.log('Login exitoso:', response.data);
      // Aquí guarda el token en localStorage si lo necesitas
      localStorage.setItem('token', response.data.token);
      
      // Redirige a dashboard o donde necesites
      // navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {error && <div className="login-form__error">{error}</div>}
      
      <div className="login-form__field">
        <label className="login-form__label">User or Email</label>
        <div className="login-form__input-wrapper">
          <svg className="login-form__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input 
            type="text" 
            name="usuario"
            placeholder="Enter your user" 
            className="login-form__input"
            value={formData.usuario}
            onChange={handleChange}
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
          <svg className="login-form__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input 
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter your password" 
            className="login-form__input"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button 
            type="button" 
            className="login-form__toggle"
            onClick={togglePassword}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        className="login-form__submit"
        disabled={loading}
      >
        {loading ? 'Cargando...' : 'Enter the table'}
      </button>
    </form>
  );
};

export default LoginForm;