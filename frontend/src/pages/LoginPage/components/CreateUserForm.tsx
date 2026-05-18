import React, { useState } from 'react';
import axios from 'axios';
import './login-form.css';  // Reusa los mismos estilos

// Iconos (puedes cambiarlos por los tuyos o usar una librería como lucide-react)
const UserIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

interface CreateUserFormProps {
  onSwitchToLogin: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    phone_number: '',
    postal_code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:8080/api/usuarios', formData);
      setSuccess('Account created! Redirecting to login...');
      
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data || 'Error creating account');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {/* Name */}
      <div className="login-form__field">
        <label className="login-form__label">Name</label>
        <div className="login-form__input-wrapper">
          <UserIcon />
          <input
            name="name"
            className="login-form__input"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </div>
      </div>

      {/* Surname */}
      <div className="login-form__field">
        <label className="login-form__label">Surname</label>
        <div className="login-form__input-wrapper">
          <UserIcon />
          <input
            name="surname"
            className="login-form__input"
            value={formData.surname}
            onChange={handleChange}
            placeholder="Your surname"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="login-form__field">
        <label className="login-form__label">Email</label>
        <div className="login-form__input-wrapper">
          <MailIcon />
          <input
            name="email"
            type="email"
            className="login-form__input"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      {/* Username */}
      <div className="login-form__field">
        <label className="login-form__label">Username</label>
        <div className="login-form__input-wrapper">
          <UserIcon />
          <input
            name="username"
            className="login-form__input"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="login-form__field">
        <label className="login-form__label">Password</label>
        <div className="login-form__input-wrapper">
          <LockIcon />
          <input
            name="password"
            type="password"
            className="login-form__input"
            value={formData.password}
            onChange={handleChange}
            placeholder="Choose a password"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="login-form__field">
        <label className="login-form__label">Phone</label>
        <div className="login-form__input-wrapper">
          <PhoneIcon />
          <input
            name="phone_number"
            className="login-form__input"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="+34 600 123 456"
          />
        </div>
      </div>

      {/* Postal Code */}
      <div className="login-form__field">
        <label className="login-form__label">Postal Code</label>
        <div className="login-form__input-wrapper">
          <MapPinIcon />
          <input
            name="postal_code"
            className="login-form__input"
            value={formData.postal_code}
            onChange={handleChange}
            placeholder="28001"
          />
        </div>
      </div>

      {error && <p className="login-form__error">{error}</p>}
      {success && <p className="login-form__success">{success}</p>}

      <button type="submit" className="login-form__submit">
        Create Account
      </button>

      <p className="login-form__switch">
        Already have an account?{' '}
        <button 
          type="button" 
          className="login-form__link-button"
          onClick={onSwitchToLogin}
        >
          Sign In
        </button>
      </p>
    </form>
  );
};

export default CreateUserForm;