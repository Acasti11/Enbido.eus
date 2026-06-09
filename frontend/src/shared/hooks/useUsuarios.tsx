import { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import type { User } from '@/shared/types/User';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      try {
        const response = await api.get('/usuarios');
        setUsers(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
};
