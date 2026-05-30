import { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types/User';

interface UseUsuariosReturn {
  usuarios: User[];
  loading: boolean;
  error: string | null;
}

export const useUsuarios = (): UseUsuariosReturn => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async (): Promise<void> => {
      try {
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  return { usuarios, loading, error };
};
