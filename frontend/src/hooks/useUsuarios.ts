import { useState, useEffect } from 'react';
import type { Usuario } from '../types/usuario';

interface UseUsuariosReturn {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
}

export const useUsuarios = (): UseUsuariosReturn => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async (): Promise<void> => {
      try {
        const response = await fetch('/api/usuarios');
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data: Usuario[] = await response.json();
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
