import { useState, useEffect, useCallback } from 'react';
import api from '@/shared/lib/api';
import type { AppNotification } from '../SettingsContext';

export const useSettingsNotifications = (
  notificationsEnabled: boolean,
  playSfx: (type: 'click' | 'deal' | 'message') => void
) => {
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [seenRequestIds, setSeenRequestIds] = useState<Set<number>>(new Set());
  const [isFirstRequestRun, setIsFirstRequestRun] = useState(true);

  const triggerNotification = useCallback((
    title: string,
    message: string,
    type: 'message' | 'friend',
    meta?: any
  ) => {
    const id = Math.random().toString();
    setActiveNotification({ id, title, message, type, meta });
    playSfx('message');
  }, [playSfx]);

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // Polling Engine for Real-Time Background Notifications
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const reqRes = await api.get('/friendships/pending');
        const requests = reqRes.data;
        if (requests && requests.length > 0) {
          const incoming = requests.filter((r: any) => r.type === 'received');
          const incomingIds = incoming.map((r: any) => r.friendshipId);

          if (!isFirstRequestRun && notificationsEnabled) {
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

    pollNotifications();
    const interval = setInterval(pollNotifications, 7000);

    return () => clearInterval(interval);
  }, [seenRequestIds, isFirstRequestRun, notificationsEnabled, triggerNotification]);

  return {
    activeNotification,
    triggerNotification,
    dismissNotification,
  };
};
