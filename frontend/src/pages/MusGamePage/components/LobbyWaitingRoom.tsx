import React from 'react';
import './lobby-waiting-room.css';

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
  // El host es el primer jugador real (normalmente en la silla 0)
  const hostPlayer = seats.find(s => s.userId !== null && !s.isBot);
  const isHost = hostPlayer && hostPlayer.userId === currentUserId;

  const totalPlayersCount = seats.filter(s => s.username !== 'Vacío').length;
  const isTableFull = totalPlayersCount === 4;

  // Asignamos una posición de mesa para renderizar en círculo
  // 0 = Abajo (Tú), 1 = Izquierda (Oeste), 2 = Arriba (Norte), 3 = Derecha (Este)
  const getSeatPositionClass = (chair: number) => {
    if (chair === 0) return 'seat-south';
    if (chair === 1) return 'seat-west';
    if (chair === 2) return 'seat-north';
    return 'seat-east';
  };

  return (
    <div className="waiting-room-overlay">
      <div className="waiting-room-card">
        
        {/* ROOM CODE TITLE */}
        <header className="room-header">
          <button className="leave-room-btn" onClick={onLeaveRoom}>
            🚪 Abandonar
          </button>
          <div className="room-title-area">
            <span className="room-tag font-bold">MESA DE MUS</span>
            <h2 className="room-code">{roomId}</h2>
          </div>
          <div className="room-count-badge">
            {totalPlayersCount}/4 Sentados
          </div>
        </header>

        {/* SETTINGS CARD SECTION */}
        <div className="room-settings-bar" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: '20px',
          fontSize: '0.85rem'
        }}>
          {isHost ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#888', fontWeight: 600 }}>REGLA REYES:</span>
                <select 
                  value={reyesOption} 
                  onChange={(e) => onUpdateConfig(e.target.value as '4' | '8', maxRounds)}
                  style={{
                    backgroundColor: '#161616',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="8">👑 8 Reyes (Español)</option>
                  <option value="4">⚔️ 4 Reyes (Vasco)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#888', fontWeight: 600 }}>CHICOS A GANAR:</span>
                <select 
                  value={maxRounds} 
                  onChange={(e) => onUpdateConfig(reyesOption, parseInt(e.target.value))}
                  style={{
                    backgroundColor: '#161616',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="1">1 Chico (Partida rápida)</option>
                  <option value="2">2 Chicos (Al mejor de 3)</option>
                  <option value="3">3 Chicos (Al mejor de 5)</option>
                </select>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', width: '100%', color: '#aaa', fontWeight: 700, letterSpacing: '0.5px' }}>
              <span>REGLAS: <strong style={{ color: '#d4af37' }}>{reyesOption} REYES</strong></span>
              <span>OBJETIVO: <strong style={{ color: '#d4af37' }}>GANAR {maxRounds} {maxRounds === 1 ? 'CHICO' : 'CHICOS'} (MEJOR DE {maxRounds === 1 ? 1 : maxRounds === 2 ? 3 : 5})</strong></span>
            </div>
          )}
        </div>

        {/* GREEN MESA PREVIEW */}
        <div className="mesa-felt-preview">
          <div className="mesa-center-logo">
            <h3 className="felt-logo-text">ENBIDO</h3>
            <span className="felt-sub-text">Sala de Espera</span>
          </div>

          {/* THE 4 CHAIRS */}
          {seats.map((seat) => {
            const isEmpty = seat.username === 'Vacío';
            const isSelf = seat.userId === currentUserId;
            
            return (
              <div 
                key={seat.chair} 
                className={`mesa-chair-node ${getSeatPositionClass(seat.chair)} ${isEmpty ? 'chair-empty' : 'chair-occupied'} ${isSelf ? 'chair-self' : ''}`}
              >
                {isEmpty ? (
                  <div className="empty-chair-inner">
                    <span className="chair-lbl">Vacío</span>
                    {isHost && (
                      <button 
                        className="add-bot-btn"
                        onClick={() => onAddBot(seat.chair)}
                      >
                        🤖 Añadir Bot
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="occupied-chair-inner">
                    <div className="avatar-circle">
                      {seat.isBot ? '🤖' : '👤'}
                    </div>
                    <span className="player-name">
                      {seat.username} {isSelf && '(Tú)'}
                    </span>
                    <span className="player-role">
                      {seat.isBot ? 'BOT COMPUTADOR' : 'JUGADOR ACTIVO'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="waiting-footer-actions">
          {isHost ? (
            <div className="host-panel">
              <p className="status-tip">
                {isTableFull 
                  ? '¡La mesa está completa! Todo listo para jugar.' 
                  : 'Rellena los asientos vacíos con Bots o espera a que entren jugadores reales.'}
              </p>
              <button 
                className="start-game-trigger"
                onClick={onStartGame}
                disabled={!isTableFull}
              >
                🎮 Comenzar Partida de Mus
              </button>
            </div>
          ) : (
            <div className="guest-panel">
              <div className="waiting-pulse-loader"></div>
              <p className="guest-waiting-lbl">
                Esperando a que el anfitrión comience la partida...
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LobbyWaitingRoom;
