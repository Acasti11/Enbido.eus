import React from 'react';
import { useTranslation } from 'react-i18next';
import { type LocalMeetupAd } from '@/features/meetup/types/MeetupTypes';
import MeetupAdCard from './MeetupAdCard';
import MeetupFilters from './MeetupFilters';

interface MeetupListViewProps {
  ads: LocalMeetupAd[];
  highlightedAdId: number | null;
  filterOnlyAvailable: boolean;
  filterOnlyMine: boolean;
  onToggleAvailable: (checked: boolean) => void;
  onToggleMine: (checked: boolean) => void;
  onCreateClick: () => void;
  onCardClick: (ad: LocalMeetupAd) => void;
  onAdDeleted: (adId: number) => void;
}

const MeetupListView: React.FC<MeetupListViewProps> = ({
  ads,
  highlightedAdId,
  filterOnlyAvailable,
  filterOnlyMine,
  onToggleAvailable,
  onToggleMine,
  onCreateClick,
  onCardClick,
  onAdDeleted
}): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div>
      <header className="list-header">
        <div>
          <h1 className="list-title">{t('meetup.title')}</h1>
          <p className="list-subtitle">{t('meetup.subtitle')}</p>
        </div>
        <button className="btn-create-main" onClick={onCreateClick}>
          {t('meetup.createAd')}
        </button>
      </header>

      <MeetupFilters
        filterOnlyAvailable={filterOnlyAvailable}
        filterOnlyMine={filterOnlyMine}
        onToggleAvailable={onToggleAvailable}
        onToggleMine={onToggleMine}
      />

      <div className="meetup-split-layout">
        <div className="meetup-map-pane">
          <div id="meetup-map" className="meetup-map"></div>
        </div>

        <div className="meetup-list-pane">
          {ads.length === 0 ? (
            <div className="meetup-empty-state">
              {t('meetup.empty')}
            </div>
          ) : (
            ads.map((ad) => (
              <div
                key={ad.adId}
                onClick={() => onCardClick(ad)}
              >
                <MeetupAdCard
                  ad={ad}
                  isHighlighted={highlightedAdId === ad.adId}
                  onDelete={onAdDeleted}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetupListView;
