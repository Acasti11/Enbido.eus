import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LocalMeetupAd } from '../types/MeetupTypes';
import CreateAdPage, { type CreateAdFormState } from './CreateAdPage';
import MeetupListView from './MeetupListView';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useMeetupData } from '../hooks/useMeetupData';
import { useMeetupMap } from '../hooks/useMeetupMap';
import { useSeo } from '@/shared/hooks/useSeo';
import api from '@/shared/lib/api';
import './meetup-page.css';
import './meetup-map.css';

const MeetupPage: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.userId || 0;
  const username = user?.username || t('meetup.currentUserFallback');

  useSeo({
    title: t('meetup.seoTitle'),
    description: t('meetup.seoDescription'),
    keywords: t('meetup.seoKeywords'),
    canonical: 'https://enbido.eus/quedadas',
    ogImage: 'https://enbido.eus/home-image-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': t('meetup.seoJsonLdName'),
      'url': 'https://enbido.eus/quedadas',
      'description': t('meetup.seoJsonLdDescription')
    }
  });

  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [highlightedAdId, setHighlightedAdId] = useState<number | null>(null);
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState<boolean>(false);
  const [filterOnlyMine, setFilterOnlyMine] = useState<boolean>(false);

  const { ads, loading, fetchMeetups, setAds } = useMeetupData();

  const filteredAds = ads.filter(ad => {
    if (filterOnlyAvailable && ad.missingPlayers <= 0) return false;
    if (filterOnlyMine && ad.creatorId !== currentUserId) return false;
    return true;
  });

  const { handleCardClick } = useMeetupMap({
    filteredAds,
    loading,
    currentView,
    currentUserId,
    isAuthenticated,
    setHighlightedAdId
  });

  const handleNavigateToCreate = (): void => setCurrentView('create');
  const handleNavigateToList = (): void => {
    setCurrentView('list');
    fetchMeetups();
  };

  const handleSaveNewAd = async (formData: CreateAdFormState): Promise<void> => {
    try {
      const payload = {
        location: formData.location,
        missingPlayers: Number(formData.missingPlayers),
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        scheduledAt: formData.scheduledAt,
        establishmentType: formData.establishmentType
      };

      const res = await api.post('/meetups', payload);
      const saved = res.data;

      const newAd: LocalMeetupAd = {
        adId: saved.adId,
        creatorId: saved.creatorId,
        creatorName: `${username} (${t('meetup.you')})`,
        location: saved.location,
        missingPlayers: saved.missingPlayers,
        description: saved.description,
        isActive: saved.isActive,
        latitude: saved.latitude,
        longitude: saved.longitude,
        scheduledAt: saved.scheduledAt,
        establishmentType: saved.establishmentType
      };

      setAds([newAd, ...ads]);
      handleNavigateToList();
    } catch (err) {
      console.error(t('meetup.errorSave'), err);
      alert(t('meetup.loginToCreate'));
    }
  };

  const handleAdDeleted = (adId: number) => {
    setAds((prev) => prev.filter((ad) => ad.adId !== adId));
  };

  return (
    <div className="page-container">
      <div className="page-content">
        {loading ? (
          <div className="meetup-loading">{t('meetup.loading')}</div>
        ) : (
          <>
            {currentView === 'list' ? (
              <MeetupListView
                ads={filteredAds}
                highlightedAdId={highlightedAdId}
                filterOnlyAvailable={filterOnlyAvailable}
                filterOnlyMine={filterOnlyMine}
                onToggleAvailable={setFilterOnlyAvailable}
                onToggleMine={setFilterOnlyMine}
                onCreateClick={handleNavigateToCreate}
                onCardClick={handleCardClick}
                onAdDeleted={handleAdDeleted}
              />
            ) : (
              <CreateAdPage
                onCancel={handleNavigateToList}
                onSubmit={handleSaveNewAd}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MeetupPage;
