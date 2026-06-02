import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/lobby-waiting-room.css';

interface SeatInfo {
  chair: number;
  username: string;
  isBot: boolean;
  userId: number | null;
}

interface LobbyWaitingRoomProps {
  roomId: string;
  seats: SeatInfo[];
  currentUserId: number;
  onAddBot: (chair: number) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  reyesOption: '4' | '8';
  maxRounds: number;
  onUpdateConfig: (reyes: '4' | '8', rounds: number) => void;
}

const getSeatPositionClass = (chair: number) => {
  if (chair === 0) return 'seat-south';
  if (chair === 1) return 'seat-west';
  if (chair === 2) return 'seat-north';
  return 'seat-east';
};

const getBestOfCount = (maxRounds: number): number => {
  if (maxRounds === 1) return 1;
  if (maxRounds === 2) return 3;
  return 5;
};

const LobbyWaitingRoom: React.FC<LobbyWaitingRoomProps> = ({
  roomId,
  seats,
  currentUserId,
  onAddBot,
  onStartGame,
  onLeaveRoom,
  reyesOption,
  maxRounds,
  onUpdateConfig,
}) => {
  const { t } = useTranslation();

  const hostPlayer = seats.find(s => s.userId !== null && !s.isBot);
  const isHost = hostPlayer && hostPlayer.userId === currentUserId;

  const totalPlayersCount = seats.filter(s => s.userId !== null || s.isBot).length;
  const isTableFull = totalPlayersCount === 4;
  const bestOf = getBestOfCount(maxRounds);

  return (
    <div className="waiting-room-overlay">
      <div className="waiting-room-card">

        <header className="room-header">
          <button className="leave-room-btn" onClick={onLeaveRoom}>
            {t('lobby.leave')}
          </button>
          <div className="room-title-area">
            <span className="room-tag font-bold">{t('lobby.musTable')}</span>
            <h2 className="room-code">{roomId}</h2>
          </div>
          <div className="room-count-badge">
            {t('lobby.seated', { count: totalPlayersCount })}
          </div>
        </header>

        <div className="room-settings-bar">
          {isHost ? (
            <>
              <div className="setting-item">
                <span className="setting-label">{t('lobby.kingsRule')}</span>
                <select
                  value={reyesOption}
                  onChange={(e) => onUpdateConfig(e.target.value as '4' | '8', maxRounds)}
                  className="setting-select"
                >
                  <option value="8">{t('lobby.kings8')}</option>
                  <option value="4">{t('lobby.kings4')}</option>
                </select>
              </div>

              <div className="setting-item">
                <span className="setting-label">{t('lobby.roundsToWin')}</span>
                <select
                  value={maxRounds}
                  onChange={(e) => onUpdateConfig(reyesOption, parseInt(e.target.value))}
                  className="setting-select"
                >
                  <option value="1">{t('lobby.round1')}</option>
                  <option value="2">{t('lobby.round2')}</option>
                  <option value="3">{t('lobby.round3')}</option>
                </select>
              </div>
            </>
          ) : (
            <div className="guest-rules-info">
              <span>{t('lobby.rules')} <strong className="guest-rule-highlight"></strong>{reyesOption} REYES</span>
              <span>{t('lobby.objective')} <strong className="guest-rule-highlight">{t('lobby.win')} {maxRounds} {maxRounds === 1 ? t('lobby.round') : t('lobby.rounds')} ({t('lobby.bestOf')} {bestOf})</strong></span>
            </div>
          )}
        </div>

        <div className="mesa-felt-preview">
          <div className="mesa-center-logo">
            <h3 className="felt-logo-text">ENBIDO</h3>
            <span className="felt-sub-text">{t('lobby.waitingRoom')}</span>
          </div>

          {seats.map((seat) => {
            const isEmpty = seat.userId === null && !seat.isBot;
            const isSelf = seat.userId === currentUserId;

            return (
              <div
                key={seat.chair}
                className={`mesa-chair-node ${getSeatPositionClass(seat.chair)} ${isEmpty ? 'chair-empty' : 'chair-occupied'} ${isSelf ? 'chair-self' : ''}`}
              >
                {isEmpty ? (
                  <div className="empty-chair-inner">
                    <span className="chair-lbl">{t('lobby.empty')}</span>
                    {isHost && (
                      <button
                        className="add-bot-btn"
                        onClick={() => onAddBot(seat.chair)}
                      >
                        {t('lobby.addBot')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="occupied-chair-inner">
                    <div className="avatar-circle">
                      {seat.isBot ? '🤖' : '👤'}
                    </div>
                    <span className="player-name">
                      {seat.username} {isSelf && t('lobby.youParenthesis')}
                    </span>
                    <span className="player-role">
                      {seat.isBot ? t('lobby.botComputer') : t('lobby.activePlayer')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="waiting-footer-actions">
          {isHost ? (
            <div className="host-panel">
              <p className="status-tip">
                {isTableFull
                  ? t('lobby.tableFull')
                  : t('lobby.fillSeats')}
              </p>
              <button
                className="start-game-trigger"
                onClick={onStartGame}
                disabled={!isTableFull}
              >
                {t('lobby.startGame')}
              </button>
            </div>
          ) : (
            <div className="guest-panel">
              <div className="waiting-pulse-loader"></div>
              <p className="guest-waiting-lbl">
                {t('lobby.waitingForHost')}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LobbyWaitingRoom;
