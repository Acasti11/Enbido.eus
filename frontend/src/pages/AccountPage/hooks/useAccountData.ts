import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';

export interface UserData {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  postalCode?: string;
  twoFactorEnabled: boolean;
}

export interface UserProfile {
  elo: number;
  coins: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}

export interface UseAccountDataReturn {
  userData: UserData | null;
  profile: UserProfile | null;
  name: string;
  setName: (value: string) => void;
  surname: string;
  setSurname: (value: string) => void;
  loading: boolean;
  saving: boolean;
  setSaving: (value: boolean) => void;
  updating2Fa: boolean;
  setUpdating2Fa: (value: boolean) => void;
  sendingReset: boolean;
  setSendingReset: (value: boolean) => void;
  successMsg: string;
  setSuccessMsg: (value: string) => void;
  errorMsg: string;
  setErrorMsg: (value: string) => void;
  refetch: () => void;
}

export const useAccountData = (): UseAccountDataReturn => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating2Fa, setUpdating2Fa] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [userRes, profileRes] = await Promise.all([
          api.get('/usuarios/me'),
          api.get('/usuarios/me/profile').catch(() => null)
        ]);
        setUserData(userRes.data);
        setName(userRes.data.name || '');
        setSurname(userRes.data.surname || '');
        if (profileRes) {
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setErrorMsg(t('account.updateError'));
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [t, refreshKey]);

  const refetch = () => setRefreshKey(k => k + 1);

  return {
    userData,
    profile,
    name,
    setName,
    surname,
    setSurname,
    loading,
    saving,
    setSaving,
    updating2Fa,
    setUpdating2Fa,
    sendingReset,
    setSendingReset,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    refetch,
  };
};
