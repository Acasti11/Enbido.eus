import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useRegisterForm } from '../hooks/useRegisterForm';
import RegisterField from './RegisterField';
import './auth-forms.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    form,
    showPassword,
    showConfirmPassword,
    showRequirements,
    setShowPassword,
    setShowConfirmPassword,
    setShowRequirements,
    attemptedSubmit,
    generalError,
    success,
    isLoading,
    isGoogleLoading,
    handleChange,
    handleBlur,
    getInputClass,
    getWrapperClass,
    handleSubmit,
    handleGoogleSuccess,
    handleGoogleError,
  } = useRegisterForm(onSwitchToLogin);

  const fieldProps = {
    form,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    showRequirements,
    setShowRequirements,
    attemptedSubmit,
    isLoading,
    handleChange,
    handleBlur,
    getInputClass,
    getWrapperClass,
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
      <RegisterField
        {...fieldProps}
        field="name"
        label={t('login.name')}
        placeholder={t('login.placeholderName')}
        icon={<User size={18} />}
        isRequired
      />

      {/* Surname */}
      <RegisterField
        {...fieldProps}
        field="surname"
        label={t('login.surname')}
        placeholder={t('login.placeholderSurname')}
        icon={<User size={18} />}
      />

      {/* Username */}
      <RegisterField
        {...fieldProps}
        field="username"
        label={t('login.username')}
        placeholder={t('login.placeholderUsername')}
        icon={<User size={18} />}
        isRequired
      />

      {/* Email */}
      <RegisterField
        {...fieldProps}
        field="email"
        label={t('login.email')}
        placeholder={t('login.placeholderEmail')}
        icon={<Mail size={18} />}
        type="email"
        isRequired
      />

      {/* Password */}
      <RegisterField
        {...fieldProps}
        field="password"
        label={t('login.password')}
        placeholder={t('login.placeholderPassword')}
        icon={<Lock size={18} />}
        type="password"
        isRequired
      />

      {/* Confirm Password */}
      <RegisterField
        {...fieldProps}
        field="confirmPassword"
        label={t('register.confirmPassword')}
        placeholder={t('register.placeholderConfirmPassword')}
        icon={<Lock size={18} />}
        type="password"
        isRequired
      />

      {/* Birth Date */}
      <RegisterField
        {...fieldProps}
        field="birthDate"
        label={t('login.birthDate')}
        placeholder=""
        icon={<Calendar size={18} />}
        type="date"
        isRequired
      />

      {/* Phone */}
      <RegisterField
        {...fieldProps}
        field="phoneNumber"
        label={t('login.phone')}
        placeholder={t('login.placeholderPhone')}
        icon={<Phone size={18} />}
      />

      {/* Postal Code */}
      <RegisterField
        {...fieldProps}
        field="postalCode"
        label={t('login.postalCode')}
        placeholder={t('login.placeholderPostalCode')}
        icon={<MapPin size={18} />}
      />

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
