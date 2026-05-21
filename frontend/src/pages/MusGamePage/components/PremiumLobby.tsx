import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './premium-lobby.css';

interface PremiumLobbyProps {
  userId: number;
  username: string;
  isSearching: boolean;
  queueSize: number;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomId: string) => void;
  onStartMatchmaking: () => void;
  onCancelMatchmaking: () => void;
  reyesMode?: number;
  onReyesModeChange?: (mode: number) => void;
}

interface UserProfile {
  elo: number;
  coins: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
}

const PremiumLobby: React.FC<PremiumLobbyProps> = ({
  userId,
  username,
  isSearching,
  queueSize,
  onJoinRoom,
  onCreateRoom,
  onStartMatchmaking,
  onCancelMatchmaking,
  reyesMode = 8,
  onReyesModeChange,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/usuarios/${userId}/profile`);
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile from DB:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleCreateRoomLocal = () => {
    const randomCode = 'SALA-' + Math.floor(100 + Math.random() * 900);
    onCreateRoom(randomCode);
  };

  const handleJoinRoomLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode.toUpperCase().trim());
    }
  };

  const winRate = profile && profile.totalGamesPlayed > 0
    ? Math.round((profile.totalGamesWon / profile.totalGamesPlayed) * 100)
    : 0;

  return (
    <div className="premium-lobby-overlay">
      <div className="premium-lobby-card">
        
        {/* LOBBY HEADER */}
        <header className="lobby-header">
          <div className="welcome-section">
            <span className="welcome-tag">JUGADOR REGISTRADO</span>
            <h1 className="welcome-title">¡Hola, {username}!</h1>
          </div>
          
          {/* USER STATS BADGES */}
          {!loading && profile && (
            <div className="header-badges">
              <div className="lobby-badge elo-badge">
                <span className="badge-icon">📊</span>
                <div className="badge-details">
                  <span className="badge-val">{profile.elo} ELO</span>
                  <span className="badge-lbl">Puntos de Rango</span>
                </div>
              </div>
              <div className="lobby-badge coins-badge">
                <span className="badge-icon">💰</span>
                <div className="badge-details">
                  <span className="badge-val">{profile.coins}</span>
                  <span className="badge-lbl">Monedas de Oro</span>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* REYES MODE SELECTOR */}
        <div className="reyes-mode-selector" style={{ marginBottom: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span className="mode-selector-label" style={{ color: '#fbbf24', display: 'block', marginBottom: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>REGLAS DE MESA:</span>
          <div className="mode-toggle-group" style={{ display: 'inline-flex', gap: '12px' }}>
            <button
              type="button"
              className={`mode-btn ${reyesMode === 8 ? 'active-mode' : ''}`}
              onClick={() => onReyesModeChange?.(8)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: reyesMode === 8 ? 'linear-gradient(135deg, #fbbf24, #b45309)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
            >
              👑 8 Reyes (Vasco)
            </button>
            <button
              type="button"
              className={`mode-btn ${reyesMode === 4 ? 'active-mode' : ''}`}
              onClick={() => onReyesModeChange?.(4)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: reyesMode === 4 ? 'linear-gradient(135deg, #fbbf24, #b45309)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
            >
              🃏 4 Reyes (Español)
            </button>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="lobby-grid">
          
          {/* COLUMN 1: QUICK MATCHMAKING */}
          <section className="lobby-column matchmaking-panel">
            <div className="panel-glow-header">
              <span className="panel-icon">⚡</span>
              <h2>Buscador de Partidas</h2>
            </div>
            <p className="panel-desc">Emparejamientos rápidos en red. Juega con los mejores musolaris conectados en directo.</p>
            
            {isSearching ? (
              <div className="search-spinner-area">
                <div className="lobby-loader"></div>
                <p className="searching-lbl">Buscando oponentes...</p>
                {queueSize > 0 && <p className="queue-size-lbl">({queueSize}/4 en cola)</p>}
                <button className="cancel-search-btn" onClick={onCancelMatchmaking}>
                  Cancelar Búsqueda
                </button>
              </div>
            ) : (
              <button className="join-queue-btn" onClick={onStartMatchmaking}>
                Buscar Partida Online
              </button>
            )}
          </section>

          {/* COLUMN 2: CUSTOM ROOMS */}
          <section className="lobby-column private-rooms-panel">
            <div className="panel-glow-header">
              <span className="panel-icon">🔑</span>
              <h2>Salas de Juego Privadas</h2>
            </div>
            <p className="panel-desc">Crea una mesa de juego personalizada con amigos o un código de sala compartido.</p>
            
            <button className="create-room-btn" onClick={handleCreateRoomLocal}>
              Crear Nueva Mesa Privada
            </button>

            <div className="divider-or"><span>O BIEN</span></div>

            <form onSubmit={handleJoinRoomLocal} className="join-room-form">
              <input
                type="text"
                placeholder="CÓDIGO DE SALA"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="room-code-input"
                maxLength={10}
                required
              />
              <button type="submit" className="join-room-submit-btn">
                Unirse a Mesa
              </button>
            </form>
          </section>
        </div>

        {/* STATS OVERVIEW SECTION */}
        {!loading && profile && (
          <footer className="lobby-footer-stats">
            <div className="footer-stat-item">
              <span className="stat-label">Partidas Jugadas</span>
              <span className="stat-value">{profile.totalGamesPlayed}</span>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">Partidas Ganadas</span>
              <span className="stat-value">{profile.totalGamesWon}</span>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">Win Rate / Tasa de Éxito</span>
              <span className="stat-value">{winRate}%</span>
            </div>
          </footer>
        )}

      </div>
    </div>
  );
};

export default PremiumLobby;
