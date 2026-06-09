import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePasswordValidation } from '@/shared/hooks/usePasswordValidation';
import PasswordStrength from './PasswordStrength';
import type { RegisterFormData } from '../types/register';
import type { UseRegisterFormReturn } from '../hooks/useRegisterForm';

interface RegisterFieldProps {
  field: keyof RegisterFormData;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  isRequired?: boolean;
  form: UseRegisterFormReturn['form'];
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: UseRegisterFormReturn['setShowPassword'];
  setShowConfirmPassword: UseRegisterFormReturn['setShowConfirmPassword'];
  showRequirements: boolean;
  setShowRequirements: UseRegisterFormReturn['setShowRequirements'];
  attemptedSubmit: boolean;
  isLoading: boolean;
  handleChange: UseRegisterFormReturn['handleChange'];
  handleBlur: UseRegisterFormReturn['handleBlur'];
  getInputClass: UseRegisterFormReturn['getInputClass'];
  getWrapperClass: UseRegisterFormReturn['getWrapperClass'];
}

const RegisterField: React.FC<RegisterFieldProps> = ({
  field,
  label,
  placeholder,
  icon,
  type = 'text',
  isRequired = false,
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
}): React.JSX.Element => {
  const { t } = useTranslation();
  const error = form.getFieldError(field);
  const isPassword = type === 'password';
  const isConfirmPassword = field === 'confirmPassword';
  const showToggle = isPassword || isConfirmPassword;
  const isVisible = isPassword ? showPassword : showConfirmPassword;
  const passwordValidation = usePasswordValidation(form.values.password);

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

      {field === 'confirmPassword' && form.values.confirmPassword && form.values.confirmPassword !== form.values.password && (
        <span className="auth-field__error">{t('register.validation.passwordsMismatch')}</span>
      )}
    </div>
  );
};

export default RegisterField;
