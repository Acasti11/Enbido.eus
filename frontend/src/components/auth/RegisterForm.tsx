import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { useFormValidation } from '../../hooks/useFormValidation';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import PasswordStrength from './PasswordStrength';
import './auth-forms.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

interface RegisterFormData extends Record<string, unknown> {
  name: string;
  surname: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  postalCode: string;
  birthDate: string;
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

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validators = {
    name: (value: string) => {
      if (!value || !value.trim()) return t('register.validation.nameRequired');
      if (value.trim().length < 2) return t('register.validation.nameMinLength');
      return undefined;
    },
    email: (value: string) => {
      if (!value || !value.trim()) return t('register.validation.emailRequired');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('register.validation.emailInvalid');
      return undefined;
    },
    username: (value: string) => {
      if (!value || !value.trim()) return t('register.validation.usernameRequired');
      if (value.trim().length < 3) return t('register.validation.usernameMinLength');
      if (/\s/.test(value)) return t('register.validation.usernameNoSpaces');
      return undefined;
    },
    password: (value: string) => {
      if (!value) return t('register.validation.passwordRequired');
      if (value.length < 8) return t('register.validation.passwordMinLength');
      if (!/[A-Z]/.test(value)) return t('register.validation.passwordUppercase');
      if (!/[a-z]/.test(value)) return t('register.validation.passwordLowercase');
      if (!/[0-9]/.test(value)) return t('register.validation.passwordNumber');
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value))
        return t('register.validation.passwordSpecialChar');
      return undefined;
    },
    confirmPassword: (value: string, allValues?: RegisterFormData) => {
      if (!value) return t('register.validation.confirmPasswordRequired');
      if (allValues && value !== allValues.password) return t('register.validation.passwordsMismatch');
      return undefined;
    },
    birthDate: (value: string) => {
      if (!value) return t('register.validation.birthDateRequired');
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) return t('register.validation.birthDateInvalid');
      return undefined;
    },
  };

  const form = useFormValidation<RegisterFormData>({
    initialValues: {
      name: '',
      surname: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      postalCode: '',
      birthDate: '',
    },
    validators: validators as unknown as Parameters<typeof useFormValidation<RegisterFormData>>[0]['validators'],
    validateOnChange: true,
  });

  const passwordValidation = usePasswordValidation(form.values.password);

  const handleChange = useCallback(
    (field: keyof RegisterFormData, value: string) => {
      form.setValue(field, value);
      if (generalError) setGeneralError('');
    },
    [form, generalError]
  );

  const handleBlur = useCallback(
    (field: keyof RegisterFormData) => {
      form.setTouched(field, true);
    },
    [form]
  );

  const getInputClass = (field: keyof RegisterFormData): string => {
    const state = form.getFieldState(field);
    if (state === 'error') return 'auth-input auth-input--error';
    if (state === 'success') return 'auth-input auth-input--success';
    return 'auth-input';
  };

  const getWrapperClass = (field: keyof RegisterFormData): string => {
    const state = form.getFieldState(field);
    if (state === 'error') return 'auth-input__wrapper auth-input__wrapper--error animate-shake';
    if (state === 'success') return 'auth-input__wrapper auth-input__wrapper--success';
    return 'auth-input__wrapper';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setSuccess('');
    setGeneralError('');

    // Custom confirm password validation with current values
    if (form.values.confirmPassword !== form.values.password) {
      form.validateField('confirmPassword');
    }

    if (!form.validateAll()) return;

    setIsLoading(true);

    try {
      const payload = {
        name: form.values.name,
        surname: form.values.surname,
        email: form.values.email,
        username: form.values.username,
        password: form.values.password,
        phoneNumber: form.values.phoneNumber,
        postalCode: form.values.postalCode,
        birthDate: form.values.birthDate,
      };
      await api.post('/usuarios', payload);
      setSuccess(t('register.success'));
      setTimeout(() => onSwitchToLogin(), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, unknown> | string; status?: number } };
      const data = axiosError.response?.data;
      const status = axiosError.response?.status;

      let msg = t('register.errorGeneric');
      if (status === 409) {
        msg = t('register.errorUsernameOrEmailExists');
      } else if (typeof data === 'object' && data !== null) {
        if (typeof data.error === 'string') msg = data.error;
        else if (typeof data.message === 'string') msg = data.message;
      } else if (typeof data === 'string') {
        msg = data;
      }
      setGeneralError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true);
    setGeneralError('');

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        setGeneralError(t('login.errorLogin'));
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
        msg = t('login.invalidCode');
      } else if (status === 403) {
        msg = t('login.wrongCode');
      } else if (typeof data === 'object' && data !== null && typeof data.error === 'string') {
        msg = data.error;
      }

      setGeneralError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGeneralError(t('login.errorLogin'));
    setIsGoogleLoading(false);
  };

  const renderField = (
    field: keyof RegisterFormData,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    type: string = 'text',
    isRequired: boolean = false
  ) => {
    const error = form.getFieldError(field);
    const isPassword = type === 'password';
    const isConfirmPassword = field === 'confirmPassword';
    const showToggle = isPassword || isConfirmPassword;
    const isVisible = isPassword ? showPassword : showConfirmPassword;

    return (
      <div className="auth-field">
        <label className="auth-label">
          {label}
          {isRequired && <span className="auth-label__required"> *</span>}
        </label>
        <div className={getWrapperClass(field)}>
          <span className="auth-input__icon">{icon}</span>
          <input
            name={String(field)}
            type={showToggle ? (isVisible ? 'text' : 'password') : type}
            className={getInputClass(field)}
            value={String(form.values[field])}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={placeholder}
            disabled={isLoading}
            required={isRequired}
          />
          {showToggle && (
            <button
              type="button"
              className="auth-input__toggle"
              onClick={() =>
                isPassword ? setShowPassword((p) => !p) : setShowConfirmPassword((p) => !p)
              }
              tabIndex={-1}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {form.getFieldState(field) === 'error' && (
            <AlertCircle className="auth-input__status auth-input__status--error" size={18} />
          )}
          {form.getFieldState(field) === 'success' && field !== 'password' && field !== 'confirmPassword' && (
            <CheckCircle2 className="auth-input__status auth-input__status--success" size={18} />
          )}
          {field === 'confirmPassword' && form.values.confirmPassword && form.values.confirmPassword === form.values.password && (
            <CheckCircle2 className="auth-input__status auth-input__status--success" size={18} />
          )}
        </div>
        {error && <span className="auth-field__error">{error}</span>}

        {/* Password strength + requirements */}
        {field === 'password' && form.values.password && (
          <PasswordStrength
            password={form.values.password}
            showRequirements={showRequirements}
            attemptedSubmit={attemptedSubmit}
          />
        )}
        {field === 'password' && !showRequirements && form.values.password && !passwordValidation.isValid && (
          <button
            type="button"
            className="auth-link auth-link--small"
            onClick={() => setShowRequirements(true)}
          >
            {t('register.password.showRequirements')}
          </button>
        )}

        {/* Confirm password match indicator */}
        {field === 'confirmPassword' && form.values.confirmPassword && form.values.confirmPassword !== form.values.password && (
          <span className="auth-field__error">{t('register.validation.passwordsMismatch')}</span>
        )}
      </div>
    );
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2 className="auth-form__title">{t('login.registerSubtitle')}</h2>

      {/* Google Login */}
      <div className="auth-google">
        {isGoogleLoading ? (
          <div className="auth-google__loading">
            <Loader2 className="auth-spinner" size={20} />
            <span>{t('login.validating')}...</span>
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

      <div className="auth-divider">
        <div className="auth-divider__line" />
        <span className="auth-divider__text">{t('login.or')}</span>
        <div className="auth-divider__line" />
      </div>

      {/* Name */}
      {renderField('name', t('login.name'), t('login.placeholderName'), <User size={18} />, 'text', true)}

      {/* Surname */}
      {renderField('surname', t('login.surname'), t('login.placeholderSurname'), <User size={18} />)}

      {/* Username */}
      {renderField(
        'username',
        t('login.username'),
        t('login.placeholderUsername'),
        <User size={18} />,
        'text',
        true
      )}

      {/* Email */}
      {renderField('email', t('login.email'), t('login.placeholderEmail'), <Mail size={18} />, 'email', true)}

      {/* Password */}
      {renderField(
        'password',
        t('login.password'),
        t('login.placeholderPassword'),
        <Lock size={18} />,
        'password',
        true
      )}

      {/* Confirm Password */}
      {renderField(
        'confirmPassword',
        t('register.confirmPassword'),
        t('register.placeholderConfirmPassword'),
        <Lock size={18} />,
        'password',
        true
      )}

      {/* Birth Date */}
      {renderField(
        'birthDate',
        t('login.birthDate'),
        '',
        <Calendar size={18} />,
        'date',
        true
      )}

      {/* Phone */}
      {renderField('phoneNumber', t('login.phone'), t('login.placeholderPhone'), <Phone size={18} />)}

      {/* Postal Code */}
      {renderField(
        'postalCode',
        t('login.postalCode'),
        t('login.placeholderPostalCode'),
        <MapPin size={18} />
      )}

      {/* General errors / success */}
      {generalError && (
        <div className="auth-alert auth-alert--error">
          <AlertCircle size={16} />
          <span>{generalError}</span>
        </div>
      )}
      {success && (
        <div className="auth-alert auth-alert--success">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Submit */}
      <button type="submit" className="auth-submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="auth-spinner" size={18} />
            {t('login.creating')}
          </>
        ) : (
          t('login.createAccount')
        )}
      </button>

      {/* Switch to login */}
      <p className="auth-switch">
        {t('login.alreadyHaveAccount')}{' '}
        <button type="button" className="auth-link" onClick={onSwitchToLogin} disabled={isLoading}>
          {t('login.signIn')}
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
