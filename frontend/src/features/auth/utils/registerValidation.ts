import type { RegisterFormData } from '../types/register';

export type RegisterValidator = (
  value: string,
  allValues?: RegisterFormData
) => string | undefined;

export const createRegisterValidators = (
  t: (key: string) => string
): Record<string, RegisterValidator> => ({
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
});
