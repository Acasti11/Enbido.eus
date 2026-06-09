import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';
import { type LocalMeetupAd, type MeetupApiResponse } from '@/features/meetup/types/MeetupTypes';

interface UseMeetupDataReturn {
  ads: LocalMeetupAd[];
  loading: boolean;
  fetchMeetups: (isBackground?: boolean) => Promise<void>;
  setAds: React.Dispatch<React.SetStateAction<LocalMeetupAd[]>>;
}

export const useMeetupData = (): UseMeetupDataReturn => {
  const { t } = useTranslation();
  const [ads, setAds] = useState<LocalMeetupAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMeetups = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/meetups');
      const mapped: LocalMeetupAd[] = res.data.map((ad: MeetupApiResponse) => ({
        adId: ad.adId,
        creatorId: ad.creatorId,
        creatorName: ad.creator ? ad.creator.name : t('meetup.userFallback'),
        location: ad.location,
        missingPlayers: ad.missingPlayers,
        description: ad.description,
        isActive: ad.isActive,
        latitude: ad.latitude,
        longitude: ad.longitude,
        scheduledAt: ad.scheduledAt,
        establishmentType: ad.establishmentType
      }));
      setAds(mapped);
    } catch (err) {
      console.error(t('meetup.errorFetch'), err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMeetups(false);

    const intervalId = setInterval(() => {
      fetchMeetups(true);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [fetchMeetups]);

  return { ads, loading, fetchMeetups, setAds };
};
