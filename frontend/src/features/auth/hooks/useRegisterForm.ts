import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CredentialResponse } from '@react-oauth/google';
import api from '@/shared/lib/api';
import { useFormValidation } from '@/shared/hooks/useFormValidation';
import { usePasswordValidation } from '@/shared/hooks/usePasswordValidation';
import type { RegisterFormData, GoogleAuthResponse } from '../types/register';
import { createRegisterValidators } from '../utils/registerValidation';

export interface UseRegisterFormReturn {
  form: ReturnType<typeof useFormValidation<RegisterFormData>>;
  passwordValidation: ReturnType<typeof usePasswordValidation>;
  showPassword: boolean;
  showConfirmPassword: boolean;
  showRequirements: boolean;
  attemptedSubmit: boolean;
  generalError: string;
  success: string;
  isLoading: boolean;
  isGoogleLoading: boolean;
  setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowConfirmPassword: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowRequirements: (value: boolean | ((prev: boolean) => boolean)) => void;
  handleChange: (field: keyof RegisterFormData, value: string) => void;
  handleBlur: (field: keyof RegisterFormData) => void;
  getInputClass: (field: keyof RegisterFormData) => string;
  getWrapperClass: (field: keyof RegisterFormData) => string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleGoogleSuccess: (credentialResponse: CredentialResponse) => Promise<void>;
  handleGoogleError: () => void;
}

export function useRegisterForm(onSwitchToLogin: () => void): UseRegisterFormReturn {
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

  const validators = createRegisterValidators(t);

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

      await api.post<GoogleAuthResponse>('/auth/google', { idToken });

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

  return {
    form,
    passwordValidation,
    showPassword,
    showConfirmPassword,
    showRequirements,
    attemptedSubmit,
    generalError,
    success,
    isLoading,
    isGoogleLoading,
    setShowPassword,
    setShowConfirmPassword,
    setShowRequirements,
    handleChange,
    handleBlur,
    getInputClass,
    getWrapperClass,
    handleSubmit,
    handleGoogleSuccess,
    handleGoogleError,
  };
}
