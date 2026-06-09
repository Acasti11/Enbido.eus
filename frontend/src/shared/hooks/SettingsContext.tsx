import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { useSettingsAudio } from './settings/useSettingsAudio';
import { useSettingsNotifications } from './settings/useSettingsNotifications';
import { NotificationToast } from './settings/NotificationToast';

export interface Settings {
  musicEnabled: boolean;
  musicVolume: number;
  soundEnabled: boolean;
  soundVolume: number;
  viewMode: '2d' | '3d';
  language: 'es' | 'eu' | 'en';
  notificationsEnabled: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'friend';
  meta?: any;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  saveSettingsToDb: () => Promise<void>;
  playSfx: (type: 'click' | 'deal' | 'message') => void;
  activeNotification: AppNotification | null;
  dismissNotification: () => void;
  triggerNotification?: (title: string, message: string, type: 'message' | 'friend', meta?: any) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const local = localStorage.getItem('enbido_settings');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // Fallback
      }
    }
    return {
      musicEnabled: true,
      musicVolume: 0.5,
      soundEnabled: true,
      soundVolume: 0.5,
      viewMode: '2d',
      language: 'es',
      notificationsEnabled: true,
    };
  });

  const { playSfx } = useSettingsAudio(settings);

  const {
    activeNotification,
    triggerNotification,
    dismissNotification,
  } = useSettingsNotifications(settings.notificationsEnabled, playSfx);

  // Save local state to localStorage
  useEffect(() => {
    localStorage.setItem('enbido_settings', JSON.stringify(settings));
  }, [settings]);

  // Load preferences from Database if user logged in
  useEffect(() => {
    const loadSettingsFromDb = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        const dbProfile = res.data;
        if (dbProfile) {
          setSettings({
            musicEnabled: dbProfile.musicEnabled !== undefined ? dbProfile.musicEnabled : true,
            musicVolume: dbProfile.musicVolume !== undefined ? dbProfile.musicVolume : 0.5,
            soundEnabled: dbProfile.soundEnabled !== undefined ? dbProfile.soundEnabled : true,
            soundVolume: dbProfile.soundVolume !== undefined ? dbProfile.soundVolume : 0.5,
            viewMode: (dbProfile.viewMode as any) || '2d',
            language: (dbProfile.language as any) || 'es',
            notificationsEnabled: dbProfile.notificationsEnabled !== undefined ? dbProfile.notificationsEnabled : true,
          });
        }
      } catch (e) {
        console.error('Error fetching settings from backend:', e);
      }
    };

    loadSettingsFromDb();
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettingsToDb = async () => {
    try {
      const getProfile = await api.get('/usuarios/me/profile');
      const currentProfile = getProfile.data;

      const updatedProfile = {
        ...currentProfile,
        musicEnabled: settings.musicEnabled,
        musicVolume: settings.musicVolume,
        soundEnabled: settings.soundEnabled,
        soundVolume: settings.soundVolume,
        viewMode: settings.viewMode,
        language: settings.language,
        notificationsEnabled: settings.notificationsEnabled,
      };

      await api.put('/usuarios/me/profile', updatedProfile);
      console.log('Preferences synchronized with the DB successfully.');
    } catch (e) {
      console.error('Failed to sync settings with DB:', e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        saveSettingsToDb,
        playSfx,
        activeNotification,
        dismissNotification,
        triggerNotification,
      }}
    >
      {children}
      <NotificationToast notification={activeNotification} onDismiss={dismissNotification} />
    </SettingsContext.Provider>
  );
};
