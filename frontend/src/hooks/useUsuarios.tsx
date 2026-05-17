import { useState, useEffect } from 'react';
import type { User_Login } from '../types/user';

interface UseUsuariosReturn {
  usuarios: User_Login[];
  loading: boolean;
  error: string | null;
}

export const useUsuarios = (): UseUsuariosReturn => {
  const [usuarios, setUsuarios] = useState<User_Login[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async (): Promise<void> => {
      try {
        const response = await fetch('/api/usuarios');
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data: User_Login[] = await response.json();
        setUsuarios(data);
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
