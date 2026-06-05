import { useMemo } from 'react';

export interface PasswordValidationResult {
  isMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  strength: number; // 0-4
  strengthLabel: 'weak' | 'fair' | 'good' | 'strong';
  isValid: boolean;
}

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function usePasswordValidation(password: string): PasswordValidationResult {
  return useMemo(() => {
    const isMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = SPECIAL_CHARS_REGEX.test(password);

    let score = 0;
    if (isMinLength) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    // Clamp score between 0 and 4
    const strength = Math.min(4, Math.max(0, score));

    let strengthLabel: PasswordValidationResult['strengthLabel'] = 'weak';
    if (strength === 4) strengthLabel = 'strong';
    else if (strength === 3) strengthLabel = 'good';
    else if (strength === 2) strengthLabel = 'fair';

    const isValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

    return {
      isMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      strength,
      strengthLabel,
      isValid,
    };
  }, [password]);
}
