import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// API Instance matching the existing project pattern
const api = axios.create({
  baseURL: '/api',
});

// Interceptor to attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  // 1. Initial State matching local storage fallback
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

  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [seenRequestIds, setSeenRequestIds] = useState<Set<number>>(new Set());
  const [isFirstRequestRun, setIsFirstRequestRun] = useState(true);

  // 2. Audio References
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background music
  useEffect(() => {
    // Beautiful, calm acoustic guitar loop track
    audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-valley-sunset-123.mp3');
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync background music state and volume
  useEffect(() => {
    if (!audioRef.current) return;

    if (settings.musicEnabled) {
      audioRef.current.volume = settings.musicVolume * 0.3; // Make it softer by default
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked by browser
          console.log('Autoplay blocked by browser. Music will start on user interaction.');
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  // Autoplay handler on first click
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (settings.musicEnabled && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch((e) => console.log('Interactive play blocked:', e));
      }
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [settings.musicEnabled]);

  // Save local state to localStorage
  useEffect(() => {
    localStorage.setItem('enbido_settings', JSON.stringify(settings));
  }, [settings]);

  // 3. Load preferences from Database if user logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

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

  // Update a single settings value
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Persist settings to backend
  const saveSettingsToDb = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Fetch latest profile state first to prevent overwriting ELO, coins, etc.
      const getProfile = await api.get('/usuarios/me/profile');
      const currentProfile = getProfile.data;

      // Merge current stats with new settings
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

  // 4. Web Audio API Sound Effects Synthesizer
  const playSfx = (type: 'click' | 'deal' | 'message') => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(settings.soundVolume * 0.4, now);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'deal') {
        // Swish slide sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'message') {
        // Double chime beeps
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gainNode.gain.setValueAtTime(settings.soundVolume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain2.gain.setValueAtTime(settings.soundVolume * 0.4, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.15);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.3);
      }
    } catch (err) {
      console.warn('Web Audio SFX blocked or unsupported:', err);
    }
  };

  // 5. Toast Notification Trigger
  const triggerNotification = (title: string, message: string, type: 'message' | 'friend', meta?: any) => {
    const id = Math.random().toString();
    setActiveNotification({ id, title, message, type, meta });
    
    // Play SFX
    playSfx('message');
  };

  const dismissNotification = () => {
    setActiveNotification(null);
  };

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // 6. Polling Engine for Real-Time Background Notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const pollNotifications = async () => {
      try {
        // B. Poll Friend Requests
        const reqRes = await api.get('/friendships/pending');
        const requests = reqRes.data;
        if (requests && requests.length > 0) {
          const incoming = requests.filter((r: any) => r.type === 'received');
          const incomingIds = incoming.map((r: any) => r.friendshipId);

          if (!isFirstRequestRun && settings.notificationsEnabled) {
            const newRequests = incoming.filter((r: any) => !seenRequestIds.has(r.friendshipId));
            newRequests.forEach((r: any) => {
              triggerNotification(
                'Petición de Amistad',
                `${r.username} te ha enviado una solicitud de amistad.`,
                'friend'
              );
            });
          }

          setSeenRequestIds(new Set(incomingIds));
          setIsFirstRequestRun(false);
        } else {
          setSeenRequestIds(new Set());
          setIsFirstRequestRun(false);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    // Run immediately and then poll every 7 seconds
    pollNotifications();
    const interval = setInterval(pollNotifications, 7000);

    return () => clearInterval(interval);
  }, [seenRequestIds, isFirstRequestRun, settings.notificationsEnabled]);

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
      
      {/* Toast Notification Popup UI */}
      {activeNotification && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '320px',
            background: 'rgba(15, 30, 22, 0.95)',
            border: '1px solid #d4af37',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(212,175,55,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
          }}
          onClick={() => {
            if (activeNotification.type === 'message' && activeNotification.meta) {
              // Trigger lobby private chat redirect
              localStorage.setItem('enbido_trigger_chat_with_friend_id', String(activeNotification.meta.friendId));
              localStorage.setItem('enbido_trigger_chat_with_friend_username', activeNotification.meta.username);
              window.dispatchEvent(new Event('storage')); // fire storage event locally
              window.location.href = '/jugar';
            } else if (activeNotification.type === 'friend') {
              window.location.href = '/jugar';
            }
            dismissNotification();
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {activeNotification.type === 'message' ? '💬 Nuevo Mensaje' : '👥 Petición Amistad'}
            </span>
            <button 
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification();
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#d4af37' }}>
            {activeNotification.title}
          </div>
          <div style={{ fontSize: '12px', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeNotification.message}
          </div>
        </div>
      )}
    </SettingsContext.Provider>
  );
};
