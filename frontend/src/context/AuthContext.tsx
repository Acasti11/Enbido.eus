import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
  surname?: string;
  username: string;
  role: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/usuarios/me');
      const data = response.data;
      setUser({
        userId: data.userId,
        email: data.email,
        name: data.name,
        surname: data.surname,
        username: data.username,
        role: data.role,
        profilePicture: data.profilePicture,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Re-check auth after login events (cookies are set, need to refresh user state)
  useEffect(() => {
    const handleLoginEvent = () => {
      checkAuth();
    };

    window.addEventListener('enbido_login', handleLoginEvent);
    return () => {
      window.removeEventListener('enbido_login', handleLoginEvent);
    };
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
