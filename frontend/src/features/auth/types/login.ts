export interface LoginError {
  type: 'invalidCredentials' | 'accountNotFound' | 'tooManyAttempts' | 'accountLocked' | 'generic';
  message: string;
}
