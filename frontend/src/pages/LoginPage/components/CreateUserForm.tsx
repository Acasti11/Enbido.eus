import React, { useState } from 'react';
import api from '../../../services/api';
import type { User } from '../../../types/User';
import '../styles/login-form.css';

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

interface CreateUserFormProps {
  onSwitchToLogin: () => void;
}

// ========== TIPOS CORREGIDOS ==========
type FormField = 'name' | 'surname' | 'email' | 'username' | 'password' | 'phone_number' | 'postal_code' | 'birthDate';

interface FormErrors extends Partial<Record<FormField, string>> {
  general?: string;
}

type FormTouched = Partial<Record<FormField, boolean>>;

// ========== REQUIRED_FIELDS CORREGIDO ==========
// Antes: (keyof User)[] incluía 'user_id' que no existe en UserFormData
const REQUIRED_FIELDS: FormField[] = ['name', 'email', 'password', 'username', 'birthDate'];

type UserFormData = Omit<User, 'user_id' | 'role' | 'is_banned' | 'created_at'>;

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    phone_number: '',
    postal_code: '',
    birthDate: ''  
  });
  
  // ========== ESTADOS CORREGIDOS ==========
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'This field is required'
      }));
      return false;
    }
    
    if (fieldName === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Invalid email format'
      }));
      return false;
    }
    
    if (fieldName === 'birthDate' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'Birth date must be in the past'
        }));
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
        newErrors[field] = 'This field is required';
        isValid = false;
      }
    });
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }
    
    setErrors(newErrors);
    setTouched(
      REQUIRED_FIELDS.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<FormField, boolean>)
    );
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    
    if (!validateAll()) {
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        surname: formData.surname?.trim() || null,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone_number?.trim() || null,  // ← camelCase
        postalCode: formData.postal_code?.trim() || null,     // ← camelCase
        birthDate: formData.birthDate,
        username: formData.username
};
      
      console.log('Sending JSON:', JSON.stringify(payload, null, 2));
      
      await api.post('/usuarios', payload);
      
      setSuccess('Account created! Redirecting to login...');
      
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
      
    } catch (err: any) {
      const errorMsg = err.response?.data || 'Error creating account';
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: FormField): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {/* Name - REQUIRED */}
      <div className="login-form__field">
        <label className="login-form__label">
          Name <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('name') ? 'login-form__input-wrapper--error' : ''}`}>
          <UserIcon />
          <input
            name="name"
            className="login-form__input"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Your name"
            required
          />
        </div>
        {getFieldError('name') && <span className="login-form__field-error">{errors.name}</span>}
      </div>

      {/* Surname - OPTIONAL */}
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
          />
        </div>
      </div>

      {/* Email - REQUIRED */}
      <div className="login-form__field">
        <label className="login-form__label">
          Email <span style={{ color: '#dc3545' }}>*</span>
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
            placeholder="your@email.com"
            required
          />
        </div>
        {getFieldError('email') && <span className="login-form__field-error">{errors.email}</span>}
      </div>

      {/* Username - REQUIRED */}
      <div className="login-form__field">
        <label className="login-form__label">
          Username <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <div className={`login-form__input-wrapper ${getFieldError('username') ? 'login-form__input-wrapper--error' : ''}`}>
          <UserIcon />
          <input
            name="username"
            className="login-form__input"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Choose a username"
            required
          />
        </div>
        {getFieldError('username') && <span className="login-form__field-error">{errors.username}</span>}
      </div>

      {/* Password - REQUIRED */}
      <div className="login-form__field">
        <label className="login-form__label">
          Password <span style={{ color: '#dc3545' }}>*</span>
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
            placeholder="Choose a password"
            required
          />
        </div>
        {getFieldError('password') && <span className="login-form__field-error">{errors.password}</span>}
      </div>

      {/* Birth Date - REQUIRED */}
      <div className="login-form__field">
        <label className="login-form__label">
          Birth Date <span style={{ color: '#dc3545' }}>*</span>
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

      {/* Phone - OPTIONAL */}
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

      {/* Postal Code - OPTIONAL */}
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

      {errors.general && <p className="login-form__error">{errors.general}</p>}
      {success && <p className="login-form__success">{success}</p>}

      <button 
        type="submit" 
        className="login-form__submit"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Account'}
      </button>

      <p className="login-form__switch">
        Already have an account?{' '}
        <button 
          type="button" 
          className="login-form__link-button"
          onClick={onSwitchToLogin}
          disabled={loading}
        >
          Sign In
        </button>
      </p>
    </form>
  );
};

export default CreateUserForm;