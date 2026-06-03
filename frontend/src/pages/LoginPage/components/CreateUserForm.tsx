import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from '../../../services/api';
import '../styles/login-form.css';

// ========== ICONOS SVG ==========
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

const CalendarIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ========== TIPOS ==========
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

type FormField = 'name' | 'surname' | 'email' | 'username' | 'password' | 'phoneNumber' | 'postalCode' | 'birthDate';

interface FormErrors extends Partial<Record<FormField, string>> {
  general?: string;
}

type FormTouched = Partial<Record<FormField, boolean>>;

const REQUIRED_FIELDS: FormField[] = ['name', 'email', 'password', 'username', 'birthDate'];

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    postalCode: '',
    birthDate: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as FormField]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as FormField];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name as FormField, formData[name as FormField]);
  };

  const validateField = (fieldName: FormField, value: string | undefined): boolean => {
    if (REQUIRED_FIELDS.includes(fieldName) && (!value || !value.trim())) {
      setErrors(prev => ({ ...prev, [fieldName]: t('login.requiredField') }));
      return false;
    }
    
    if (fieldName === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, [fieldName]: t('login.invalidEmail') }));
      return false;
    }
    
    if (fieldName === 'birthDate' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) {
        setErrors(prev => ({ ...prev, [fieldName]: t('login.invalidBirthDate') }));
        return false;
      }
    }
    
    return true;
  };

  const validateAll = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {};
    
    REQUIRED_FIELDS.forEach(field => {
      const value = formData[field];
      if (!value || !value.trim()) {
        newErrors[field] = t('login.requiredField');
        isValid = false;
      }
    });
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('login.invalidEmail');
      isValid = false;
    }
    
    setErrors(newErrors);
    setTouched(REQUIRED_FIELDS.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<FormField, boolean>));
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setErrors({});

    if (!validateAll()) return;
    
    setIsLoading(true);

    try {
      await api.post('/usuarios', formData);
      setSuccess(t('login.successCreateAccount'));
      setTimeout(() => onSwitchToLogin(), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, unknown> | string } };
      const data = axiosError.response?.data;
      const msg = (typeof data === 'object' && data !== null && typeof data.error === 'string'
        ? data.error
        : undefined) || t('login.errorCreateAccount');
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        setErrors({ general: t('login.errorLogin') });
        setIsGoogleLoading(false);
        return;
      }

      const response = await api.post<GoogleAuthResponse>('/auth/google', { idToken });
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
      const axiosError = err as { response?: { status?: number; data?: Record<string, unknown> | string } };
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      let msg = t('login.errorLogin');
      if (status === 401) {
        msg = t('login.invalidCode') || 'Invalid Google token. Please try again.';
      } else if (status === 403) {
        msg = t('login.wrongCode') || 'User is banned.';
      } else if (typeof data === 'object' && data !== null && typeof data.error === 'string') {
        msg = data.error;
      }

      setErrors({ general: msg });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({ general: t('login.errorLogin') });
    setIsGoogleLoading(false);
  };

  const getFieldError = (fieldName: FormField): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <h2 style={{ color: '#d4af37', textAlign: 'center', marginBottom: '16px' }}>
        {t('login.registerSubtitle')}
      </h2>

      <div style={{ marginBottom: '16px' }}>
        {isGoogleLoading ? (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <span style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '2px solid #d4af37',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
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

      {/* Name */}
      <div className="login-form__field">
        <label className="login-form__label">
          {t('login.name')} <span>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('name') ? 'login-form__input-wrapper--error' : ''}`}>
          <UserIcon />
          <input
            name="name"
            className="login-form__input"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('login.placeholderName')}
            required
          />
        </div>
        {getFieldError('name') && <span className="login-form__field-error">{errors.name}</span>}
      </div>

      {/* Surname */}
      <div className="login-form__field">
        <label className="login-form__label">{t('login.surname')}</label>
        <div className="login-form__input-wrapper">
          <UserIcon />
          <input
            name="surname"
            className="login-form__input"
            value={formData.surname}
            onChange={handleChange}
            placeholder={t('login.placeholderSurname')}
          />
        </div>
      </div>

      {/* Username */}
      <div className="login-form__field">
        <label className="login-form__label">
          {t('login.username')} <span>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('username') ? 'login-form__input-wrapper--error' : ''}`}>
          <UserIcon />
          <input
            name="username"
            className="login-form__input"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('login.placeholderUsername')}
            required
          />
        </div>
        {getFieldError('username') && <span className="login-form__field-error">{errors.username}</span>}
      </div>

      {/* Email */}
      <div className="login-form__field">
        <label className="login-form__label">
          {t('login.email')} <span>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('email') ? 'login-form__input-wrapper--error' : ''}`}>
          <MailIcon />
          <input
            name="email"
            type="email"
            className="login-form__input"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('login.placeholderEmail')}
            required
          />
        </div>
        {getFieldError('email') && <span className="login-form__field-error">{errors.email}</span>}
      </div>

      {/* Password */}
      <div className="login-form__field">
        <label className="login-form__label">
          {t('login.password')} <span>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('password') ? 'login-form__input-wrapper--error' : ''}`}>
          <LockIcon />
          <input
            name="password"
            type="password"
            className="login-form__input"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('login.placeholderPassword')}
            required
          />
        </div>
        {getFieldError('password') && <span className="login-form__field-error">{errors.password}</span>}
      </div>

      {/* Birth Date */}
      <div className="login-form__field">
        <label className="login-form__label">
          {t('login.birthDate')} <span>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('birthDate') ? 'login-form__input-wrapper--error' : ''}`}>
          <CalendarIcon />
          <input
            name="birthDate"
            type="date"
            className="login-form__input"
            value={formData.birthDate}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
        </div>
        {getFieldError('birthDate') && <span className="login-form__field-error">{errors.birthDate}</span>}
      </div>

      {/* Phone */}
      <div className="login-form__field">
        <label className="login-form__label">{t('login.phone')}</label>
        <div className="login-form__input-wrapper">
          <PhoneIcon />
          <input
            name="phoneNumber"
            className="login-form__input"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder={t('login.placeholderPhone')}
          />
        </div>
      </div>

      {/* Postal Code */}
      <div className="login-form__field">
        <label className="login-form__label">{t('login.postalCode')}</label>
        <div className="login-form__input-wrapper">
          <MapPinIcon />
          <input
            name="postalCode"
            className="login-form__input"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder={t('login.placeholderPostalCode')}
          />
        </div>
      </div>

      {/* Errores y éxito */}
      {errors.general && <p className="login-form__error">{errors.general}</p>}
      {success && (
        <p style={{ color: '#4ade80', textAlign: 'center', fontSize: '14px' }}>{success}</p>
      )}

      {/* Submit */}
      <button 
        type="submit" 
        className="login-form__submit"
        disabled={isLoading}
      >
        {isLoading ? t('login.creating') : t('login.createAccount')}
      </button>

      {/* Switch to login */}
      <p className="login-form__switch">
        {t('login.alreadyHaveAccount')}{' '}
        <button 
          type="button" 
          className="login-form__link-button"
          onClick={onSwitchToLogin}
          disabled={isLoading}
        >
          {t('login.signIn')}
        </button>
      </p>
    </form>
  );
};

export default CreateUserForm;