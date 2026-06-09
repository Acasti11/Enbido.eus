import React from 'react';
import { useTranslation } from 'react-i18next';

interface PrivateRoomsPanelProps {
  roomCode: string;
  onRoomCodeChange: (code: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}

const PrivateRoomsPanel: React.FC<PrivateRoomsPanelProps> = ({
  roomCode,
  onRoomCodeChange,
  onCreateRoom,
  onJoinRoom,
}) => {
  const { t } = useTranslation();

  const handleJoinRoomLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode.toUpperCase().trim());
    }
  };

  return (
    <section className="lobby-column private-rooms-panel">
      <div className="panel-glow-header">
        <span className="panel-icon">🔑</span>
        <h2>{t('premiumLobby.privateRooms')}</h2>
      </div>
      <p className="panel-desc">{t('premiumLobby.privateRoomsDesc')}</p>

      <button className="create-room-btn" onClick={onCreateRoom}>
        {t('premiumLobby.createNewRoom')}
      </button>

      <div className="divider-or"><span>{t('premiumLobby.or')}</span></div>

      <form onSubmit={handleJoinRoomLocal} className="join-room-form">
        <input
          type="text"
          placeholder={t("premiumLobby.roomCode")}
          value={roomCode}
          onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
          className="room-code-input"
          maxLength={10}
          required
        />
        <button type="submit" className="join-room-submit-btn">
          {t('premiumLobby.joinTable')}
        </button>
      </form>
    </section>
  );
};

export default PrivateRoomsPanel;
