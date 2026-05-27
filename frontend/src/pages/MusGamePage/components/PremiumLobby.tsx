import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import './premium-lobby.css';

interface PremiumLobbyProps {
  userId: number;
  username: string;
  isSearching: boolean;
  queueSize: number;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomId: string) => void;
  onStartMatchmaking: (reyes: '4' | '8') => void;
  onCancelMatchmaking: () => void;
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
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReyes, setSelectedReyes] = useState<'4' | '8'>('8');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/usuarios/${userId}/profile`);
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
              <>
                <div className="reyes-selector-matchmaking" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px', width: '100%' }}>
                  <label style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700, letterSpacing: '0.5px' }}>REGLAS DE REYES:</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedReyes('8')} 
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedReyes === '8' ? '2px solid #d4af37' : '1px solid #333',
                        backgroundColor: selectedReyes === '8' ? 'rgba(212, 175, 55, 0.12)' : '#161616',
                        color: selectedReyes === '8' ? '#d4af37' : '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        boxShadow: selectedReyes === '8' ? '0 0 10px rgba(212, 175, 55, 0.25)' : 'none'
                      }}
                    >
                      👑 8 Reyes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedReyes('4')} 
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedReyes === '4' ? '2px solid #d4af37' : '1px solid #333',
                        backgroundColor: selectedReyes === '4' ? 'rgba(212, 175, 55, 0.12)' : '#161616',
                        color: selectedReyes === '4' ? '#d4af37' : '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        boxShadow: selectedReyes === '4' ? '0 0 10px rgba(212, 175, 55, 0.25)' : 'none'
                      }}
                    >
                      ⚔️ 4 Reyes
                    </button>
                  </div>
                </div>
                <button className="join-queue-btn" onClick={() => onStartMatchmaking(selectedReyes)}>
                  Buscar Partida Online
                </button>
              </>
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
