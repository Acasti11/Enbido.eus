import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalMeetupAd } from '../../types/MeetupTypes';

interface MeetupCardHeaderProps {
  ad: LocalMeetupAd;
}

const getEstablishmentIcon = (type: string | undefined): string => {
  switch (type) {
    case 'TXOKO': return '🍽️';
    case 'CAFE': return '☕';
    case 'OUTDOOR': return '🌳';
    case 'BAR':
    default:
      return '🍻';
  }
};

const getEstablishmentLabel = (type: string | undefined, t: (key: string) => string): string => {
  switch (type) {
    case 'TXOKO': return t('meetup.txoko');
    case 'CAFE': return t('meetup.cafe');
    case 'OUTDOOR': return t('meetup.outdoor');
    case 'BAR':
    default:
      return t('meetup.bar');
  }
};

const formatScheduledDate = (dateStr: string | undefined, t: (key: string) => string): string => {
  if (!dateStr) return t('meetup.dateTBD');
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

const MeetupCardHeader: React.FC<MeetupCardHeaderProps> = ({ ad }): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="ad-card__header">
      <div className="ad-card__header-top">
        <h2 className="ad-card__location">
          <span>{getEstablishmentIcon(ad.establishmentType)}</span>
          <span>{ad.location}</span>
        </h2>
        <span className="establishment-type-tag">
          {getEstablishmentLabel(ad.establishmentType, t)}
        </span>
      </div>

      <div className="ad-card__meta-info">
        <span>{t('meetup.organizedBy', { name: ad.creatorName })}</span>
        {ad.scheduledAt && (
          <span className="ad-card__date-tag">
            📅 {formatScheduledDate(ad.scheduledAt, t)}
          </span>
        )}
      </div>
    </div>
  );
};

export default MeetupCardHeader;
