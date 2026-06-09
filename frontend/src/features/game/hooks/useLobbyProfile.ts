import { useState, useCallback } from 'react';
import api from '@/shared/lib/api';
import type { UserProfile } from '@/features/game/domain/lobby.types';

export function useLobbyProfile(_currentUserId: number) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await api.get('/usuarios/me/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching player profile from DB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, fetchProfileData, setLoading };
}
