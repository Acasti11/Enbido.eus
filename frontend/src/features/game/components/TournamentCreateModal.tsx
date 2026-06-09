import React from 'react';
import { useTranslation } from 'react-i18next';

interface TournamentCreateModalProps {
  show: boolean;
  newTourneyName: string;
  newTourneyCoinsFee: string;
  newTourneyCoinsReward: string;
  newTourneyMaxTeams: string;
  newTourneyDate: string;
  newTourneyTime: string;
  newTourneyLocation: string;
  creatingTourney: boolean;
  onNameChange: (v: string) => void;
  onCoinsFeeChange: (v: string) => void;
  onCoinsRewardChange: (v: string) => void;
  onMaxTeamsChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSetTimeToMinutesFromNow: (minutes: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const TournamentCreateModal: React.FC<TournamentCreateModalProps> = ({
  show,
  newTourneyName,
  newTourneyCoinsFee,
  newTourneyCoinsReward,
  newTourneyMaxTeams,
  newTourneyDate,
  newTourneyTime,
  newTourneyLocation,
  creatingTourney,
  onNameChange,
  onCoinsFeeChange,
  onCoinsRewardChange,
  onMaxTeamsChange,
  onDateChange,
  onTimeChange,
  onLocationChange,
  onSetTimeToMinutesFromNow,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="tourney-modal-overlay" onClick={onClose}>
      <div className="tourney-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="tourney-modal-header">
          <h2 className="tourney-modal-title">{t('premiumLobby.createTourneyTitle')}</h2>
          <button className="tourney-modal-close-x" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
              {t('premiumLobby.tourneyName')}
            </label>
            <input
              type="text"
              value={newTourneyName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ej: Súper Torneo Rápido"
              required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                {t('premiumLobby.coinsFeeLabel')}
              </label>
              <input
                type="number"
                value={newTourneyCoinsFee}
                onChange={(e) => onCoinsFeeChange(e.target.value)}
                min="0"
                required
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                {t('premiumLobby.coinsRewardLabel')}
              </label>
              <input
                type="number"
                value={newTourneyCoinsReward}
                onChange={(e) => onCoinsRewardChange(e.target.value)}
                min="0"
                required
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                {t('premiumLobby.maxTeamsLabel')}
              </label>
              <select
                value={newTourneyMaxTeams}
                onChange={(e) => onMaxTeamsChange(e.target.value)}
                style={{ background: '#121915', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none', width: '100%' }}
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                {t('premiumLobby.locationLabel')}
              </label>
              <input
                type="text"
                value={newTourneyLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                required
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                {t('premiumLobby.dateTimeLabel')}
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onSetTimeToMinutesFromNow(1)}
                  style={{ fontSize: '0.75rem', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--color-gold)', borderRadius: '4px', padding: '2px 8px', color: 'var(--color-gold-light)', cursor: 'pointer' }}
                >
                  +1 min
                </button>
                <button
                  type="button"
                  onClick={() => onSetTimeToMinutesFromNow(5)}
                  style={{ fontSize: '0.75rem', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--color-gold)', borderRadius: '4px', padding: '2px 8px', color: 'var(--color-gold-light)', cursor: 'pointer' }}
                >
                  +5 min
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input
                type="date"
                value={newTourneyDate}
                onChange={(e) => onDateChange(e.target.value)}
                required
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none' }}
              />
              <input
                type="time"
                value={newTourneyTime}
                onChange={(e) => onTimeChange(e.target.value)}
                required
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '12px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t('premiumLobby.cancel')}
            </button>
            <button
              type="submit"
              disabled={creatingTourney}
              style={{ flex: 1, background: 'var(--color-gold)', border: 'none', borderRadius: '6px', padding: '12px', color: '#000', fontWeight: 'bold', cursor: 'pointer', opacity: creatingTourney ? 0.7 : 1 }}
            >
              {creatingTourney ? t('premiumLobby.creating') : t('premiumLobby.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentCreateModal;
