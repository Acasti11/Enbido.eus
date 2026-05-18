import React from 'react';
import './meetup-ad-card.css';

// Integramos la interfaz aquí para evitar errores de archivos faltantes
export interface LocalMeetupAd {
  adId: number;
  creatorId: number;
  creatorName: string;
  location: string;
  missingPlayers: number;
  description: string;
  isActive: boolean;
}

interface MeetupCardProps {
  ad: LocalMeetupAd;
}

const MeetupAdCard: React.FC<MeetupCardProps> = ({ ad }): React.JSX.Element => {
  return (
    <article className="ad-card">
      <div className="ad-card__header">
        <h3 className="ad-card__location">{ad.location}</h3>
        <p className="ad-card__creator">
          Organizado por: <strong>{ad.creatorName}</strong>
        </p>
      </div>
      
      <div className="ad-card__body">
        <span className="ad-card__players">⚠️ Faltan {ad.missingPlayers} jugadores</span>
        <p className="ad-card__desc">{ad.description}</p>
      </div>
    </article>
  );
};

export default MeetupAdCard;