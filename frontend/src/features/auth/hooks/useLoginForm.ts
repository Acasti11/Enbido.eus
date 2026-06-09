import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import type { LoginError } from '../types/login';

export interface UseLoginFormProps {
  on2FaStatusChange?: (isActive: boolean) => void;
}

export interface UseLoginFormReturn {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void;
  loginError: LoginError | null;
  setLoginError: (error: LoginError | null) => void;
  isLoading: boolean;
  fieldErrors: { username?: string; password?: string };
  setFieldErrors: React.Dispatch<React.SetStateAction<{ username?: string; password?: string }>>;
  twoFactorRequired: boolean;
  tempUserId: number | null;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  countdown: number;
  twoFactorError: string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleVerify2Fa: (e: React.FormEvent) => Promise<void>;
  handleBack: () => void;
  getErrorFromResponse: (err: unknown) => LoginError;
  validateFields: () => boolean;
  formatTime: (seconds: number) => string;
  getInputWrapperClass: (hasError: boolean) => string;
}

export const useLoginForm = ({ on2FaStatusChange }: UseLoginFormProps): UseLoginFormReturn => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [twoFactorError, setTwoFactorError] = useState('');

  useEffect(() => {
    if (on2FaStatusChange) {
      on2FaStatusChange(twoFactorRequired);
    }
  }, [twoFactorRequired, on2FaStatusChange]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (twoFactorRequired && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoFactorRequired, countdown]);

  const getErrorFromResponse = useCallback((err: unknown): LoginError => {
    const axiosError = err as {
      response?: {
        status?: number;
        data?: Record<string, unknown> | string;
      };
    };
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    const rawMessage =
      (typeof data === 'object' && data !== null && typeof data.error === 'string'
        ? data.error
        : undefined) ||
      (typeof data === 'object' && data !== null && typeof data.message === 'string'
        ? data.message
        : undefined) ||
      (typeof data === 'string' ? data : '');

    const msgLower = rawMessage.toLowerCase();

    if (status === 429 || msgLower.includes('too many') || msgLower.includes('rate limit')) {
      return { type: 'tooManyAttempts', message: t('login.error.tooManyAttempts') };
    }
    if (status === 403 || msgLower.includes('locked') || msgLower.includes('bloqueada') || msgLower.includes('bloqueado')) {
      return { type: 'accountLocked', message: t('login.error.accountLocked') };
    }
    if (status === 404 || msgLower.includes('not found') || msgLower.includes('no existe') || msgLower.includes('ez da existitzen')) {
      return { type: 'accountNotFound', message: t('login.error.accountNotFound') };
    }
    if (status === 401 || msgLower.includes('invalid') || msgLower.includes('incorrect') || msgLower.includes('wrong')) {
      return { type: 'invalidCredentials', message: t('login.error.invalidCredentials') };
    }

    return { type: 'generic', message: rawMessage || t('login.errorLogin') };
  }, [t]);

  const validateFields = useCallback((): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = t('login.error.usernameRequired');
    if (!password) errors.password = t('login.error.passwordRequired');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, password, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setFieldErrors({});

    if (!validateFields()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/usuarios/login', {
        username,
        password,
      });

      const { twoFactorRequired: requires2Fa, tempUserId: userId } = response.data;

      if (requires2Fa) {
        setTempUserId(userId);
        setTwoFactorRequired(true);
        setCountdown(300);
        setVerificationCode('');
        setIsLoading(false);
        return;
      }

      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');
    } catch (err: unknown) {
      const error = getErrorFromResponse(err);
      setLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');

    if (verificationCode.length !== 6) {
      setTwoFactorError(t('login.invalidCode'));
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/usuarios/login/verify-2fa', {
        userId: tempUserId,
        code: verificationCode.trim(),
      });

      window.dispatchEvent(new Event('enbido_login'));
      navigate('/jugar');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, unknown> | string } };
      const data = axiosError.response?.data;
      const msg =
        (typeof data === 'object' && data !== null && typeof data.error === 'string'
          ? data.error
          : undefined) ||
        (typeof data === 'object' && data !== null && typeof data.message === 'string'
          ? data.message
          : undefined) ||
        t('login.wrongCode');
      setTwoFactorError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setTwoFactorRequired(false);
    setVerificationCode('');
    setTwoFactorError('');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getInputWrapperClass = (hasError: boolean): string => {
    if (hasError) return 'auth-input__wrapper auth-input__wrapper--error animate-shake';
    return 'auth-input__wrapper';
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loginError,
    setLoginError,
    isLoading,
    fieldErrors,
    setFieldErrors,
    twoFactorRequired,
    tempUserId,
    verificationCode,
    setVerificationCode,
    countdown,
    twoFactorError,
    handleSubmit,
    handleVerify2Fa,
    handleBack,
    getErrorFromResponse,
    validateFields,
    formatTime,
    getInputWrapperClass,
  };
};
