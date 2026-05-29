import React, { useEffect, useState, useRef } from 'react';
import api from '../../../services/api';
import '../styles/premium-lobby.css';

interface PremiumLobbyProps {
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

interface Friend {
  id: number;
  username: string;
  elo: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  status: 'online' | 'offline';
  isBot?: boolean;
}

interface ChatMessage {
  senderId: number;
  senderName: string;
  content: string;
  timestamp: number;
}

interface UserLeaderboardDto {
  userId: number;
  username: string;
  elo: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  winRate: number;
  equippedTitle: string;
}

const PremiumLobby: React.FC<PremiumLobbyProps> = ({
  username,
  isSearching,
  queueSize,
  onJoinRoom,
  onCreateRoom,
  onStartMatchmaking,
  onCancelMatchmaking,
}) => {
  const currentUserId = Number(localStorage.getItem('userId') || '1');
  const activeUsername = localStorage.getItem('username') || 'Usuario';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReyes, setSelectedReyes] = useState<'4' | '8'>('8');

  // ---------- LEADERBOARD STATES ----------
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<UserLeaderboardDto[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // ---------- SOCIAL STATES ----------
  const [socialTab, setSocialTab] = useState<'amigos' | 'buscar' | 'requests'>('amigos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  
  // Chat & Profile overlays
  const [activeChatUser, setActiveChatUser] = useState<Friend | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] = useState<Friend | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const handleOpenLeaderboard = async () => {
    setShowLeaderboard(true);
    setLoadingLeaderboard(true);
    try {
      const res = await api.get('/usuarios/leaderboard');
      setLeaderboardData(res.data);
    } catch (err) {
      console.error('Error fetching ELO leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // ---------- INITIALIZE PROFILE & SOCIAL ----------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile from DB:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Inicializar amigos en localStorage
    const savedFriends = localStorage.getItem(`enbido_friends_${currentUserId}`);
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    } else {
      // Bots iniciales por defecto para dar interactividad
      const defaultFriends: Friend[] = [
        { id: -1, username: 'MusLar-99', elo: 1420, totalGamesPlayed: 120, totalGamesWon: 74, status: 'online', isBot: true },
        { id: -2, username: 'AnderMus', elo: 1100, totalGamesPlayed: 45, totalGamesWon: 20, status: 'online', isBot: true },
        { id: -3, username: 'AmaiaTxapeldun', elo: 1650, totalGamesPlayed: 250, totalGamesWon: 160, status: 'offline', isBot: true }
      ];
      localStorage.setItem(`enbido_friends_${currentUserId}`, JSON.stringify(defaultFriends));
      setFriends(defaultFriends);
    }

    // Inicializar peticiones pendientes
    const savedRequests = localStorage.getItem(`enbido_requests_${currentUserId}`);
    if (savedRequests) {
      setRequests(JSON.parse(savedRequests));
    } else {
      const defaultRequests = ['MikelMuslar', 'GorkaMus_88'];
      localStorage.setItem(`enbido_requests_${currentUserId}`, JSON.stringify(defaultRequests));
      setRequests(defaultRequests);
    }
  }, [currentUserId]);

  // Sincronizar chat con el usuario activo
  useEffect(() => {
    if (!activeChatUser) return;
    const loadChat = () => {
      const key = `enbido_chat_with_${currentUserId}_and_${activeChatUser.id}`;
      const savedMsgs = localStorage.getItem(key);
      if (savedMsgs) {
        setChatMessages(JSON.parse(savedMsgs));
      } else {
        setChatMessages([]);
      }
    };
    loadChat();
    
    // Auto-scroll al final del chat
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
      }
    }, 100);
  }, [activeChatUser, currentUserId]);

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Listener para cuando se abre chat de quedadas desde fuera (localStorage trigger)
  useEffect(() => {
    const checkExternalChat = () => {
      const targetUser = localStorage.getItem('enbido_open_dm_target');
      if (targetUser) {
        localStorage.removeItem('enbido_open_dm_target');
        const parsed = JSON.parse(targetUser);
        
        // Verificar si ya es amigo, si no, lo añadimos
        setFriends((prevFriends) => {
          const exists = prevFriends.find(f => f.username === parsed.username);
          if (exists) {
            setActiveChatUser(exists);
            return prevFriends;
          } else {
            const newFriend: Friend = {
              id: parsed.id,
              username: parsed.username,
              elo: parsed.elo || 1000,
              totalGamesPlayed: parsed.totalGamesPlayed || 0,
              totalGamesWon: parsed.totalGamesWon || 0,
              status: 'online'
            };
            const updated = [newFriend, ...prevFriends];
            localStorage.setItem(`enbido_friends_${currentUserId}`, JSON.stringify(updated));
            setActiveChatUser(newFriend);
            return updated;
          }
        });
      }
    };
    
    const interval = setInterval(checkExternalChat, 500);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // ---------- SOCIAL ACTIONS ----------
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get('/usuarios');
      // Filtrar la lista de usuarios en base a la query (excluyendo el usuario propio)
      const matches = res.data.filter((u: any) => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) && 
        u.username !== activeUsername
      );
      setSearchResults(matches);
    } catch (err) {
      console.error('Error searching registered users:', err);
    }
  };

  const handleSendFriendRequest = (targetUser: any) => {
    // Al ser una simulación local, lo añadimos directamente como amigo para que sea interactivo
    const isAlreadyFriend = friends.some(f => f.id === targetUser.user_id);
    if (isAlreadyFriend) {
      alert('Ya tienes agregado a este jugador.');
      return;
    }

    const newFriend: Friend = {
      id: targetUser.user_id,
      username: targetUser.username,
      elo: 1000 + Math.floor(Math.random() * 400), // Elo aleatorio de inicio
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      status: Math.random() > 0.3 ? 'online' : 'offline'
    };

    const updated = [newFriend, ...friends];
    setFriends(updated);
    localStorage.setItem(`enbido_friends_${currentUserId}`, JSON.stringify(updated));
    alert(`¡Solicitud aceptada automáticamente! ${targetUser.username} se ha añadido a tus amigos.`);
  };

  const handleAcceptRequest = (requestName: string) => {
    const newFriend: Friend = {
      id: Math.floor(Math.random() * 10000) + 100,
      username: requestName,
      elo: 1050 + Math.floor(Math.random() * 300),
      totalGamesPlayed: 14,
      totalGamesWon: 6,
      status: 'online'
    };

    const updatedFriends = [newFriend, ...friends];
    setFriends(updatedFriends);
    localStorage.setItem(`enbido_friends_${currentUserId}`, JSON.stringify(updatedFriends));

    const updatedRequests = requests.filter(r => r !== requestName);
    setRequests(updatedRequests);
    localStorage.setItem(`enbido_requests_${currentUserId}`, JSON.stringify(updatedRequests));
  };

  const handleDeclineRequest = (requestName: string) => {
    const updatedRequests = requests.filter(r => r !== requestName);
    setRequests(updatedRequests);
    localStorage.setItem(`enbido_requests_${currentUserId}`, JSON.stringify(updatedRequests));
  };

  // ---------- CHAT ACTIONS & BOT AUTO-REPLY ----------
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;

    const myMsg: ChatMessage = {
      senderId: currentUserId,
      senderName: activeUsername,
      content: chatInput.trim(),
      timestamp: Date.now()
    };

    const updatedMsgs = [...chatMessages, myMsg];
    setChatMessages(updatedMsgs);
    setChatInput('');

    const key = `enbido_chat_with_${currentUserId}_and_${activeChatUser.id}`;
    localStorage.setItem(key, JSON.stringify(updatedMsgs));

    // Si es un bot, responder automáticamente con demora
    if (activeChatUser.isBot) {
      setTimeout(() => {
        let botResponseContent = '';
        if (activeChatUser.id === -1) { // MusLar-99
          const replies = [
            '¡Hola! ¿Echamos unas manos a 8 Reyes? Abre una sala y pásame el código. ⚔️',
            'Recuerda: morder el labio inferior es tener dos Reyes. ¡Usa las señas! 🤫',
            '¡Envido a pares! ¿Qué me dices?',
            'Hoy tengo duples seguro. No me busques las cosquillas...'
          ];
          botResponseContent = replies[Math.floor(Math.random() * replies.length)];
        } else if (activeChatUser.id === -2) { // AnderMus
          const replies = [
            'Kaixo! Zabaldu mahaia eta sartuko naiz! 🚪',
            'Gran partida la de ayer. ¿Has visto las señas en el menú de Reglas?',
            'Aupa mutil! Jokatuko dugu gero?',
            'Tengo una mano buenísima. ¿Hacemos órdago?'
          ];
          botResponseContent = replies[Math.floor(Math.random() * replies.length)];
        } else if (activeChatUser.id === -3) { // AmaiaTxapeldun
          botResponseContent = 'Hola, hoy estoy offline, pero avísame mañana para jugar el torneo presencial en Bilbao. ¡Txapela buruan! 🏆';
        }

        const botMsg: ChatMessage = {
          senderId: activeChatUser.id,
          senderName: activeChatUser.username,
          content: botResponseContent,
          timestamp: Date.now()
        };

        const updatedWithBot = [...updatedMsgs, botMsg];
        setChatMessages(updatedWithBot);
        localStorage.setItem(key, JSON.stringify(updatedWithBot));
      }, 1500);
    }
  };

  // ---------- REST OF LOBBY LOGIC ----------
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
              <button 
                className="lobby-badge leaderboard-trigger-btn"
                onClick={handleOpenLeaderboard}
                title="Ver clasificación general"
              >
                <span className="badge-icon">🏆</span>
                <div className="badge-details">
                  <span className="badge-val">Ver Ranking</span>
                  <span className="badge-lbl">Clasificación</span>
                </div>
              </button>
            </div>
          )}
        </header>

        {/* DASHBOARD GRID - 3 COLUMNS */}
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

          {/* COLUMN 3: SOCIAL & FRIENDS PANEL */}
          <section className="social-panel" aria-label="Social y Amigos">
            <div className="social-header-box">
              <span className="panel-icon" style={{ fontSize: '18px' }}>👥</span>
              <h2>Comunidad y Amigos</h2>
            </div>

            {/* TABS HEADER */}
            <div className="social-tabs">
              <button 
                className={`social-tab-btn ${socialTab === 'amigos' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('amigos')}
              >
                Amigos ({friends.length})
              </button>
              <button 
                className={`social-tab-btn ${socialTab === 'buscar' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('buscar')}
              >
                Buscar
              </button>
              <button 
                className={`social-tab-btn ${socialTab === 'requests' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('requests')}
              >
                Peticiones ({requests.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="social-content-area">
              
              {/* TAB 1: FRIENDS LIST */}
              {socialTab === 'amigos' && (
                friends.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: '11px', textAlign: 'center', marginTop: '30px', fontStyle: 'italic' }}>
                    Aún no tienes amigos agregados.
                  </div>
                ) : (
                  friends.map(friend => (
                    <div key={friend.id} className="friend-item">
                      <div className="friend-info-block">
                        <div className="friend-avatar-circle">
                          {friend.username.substring(0,2).toUpperCase()}
                        </div>
                        <div className="friend-details">
                          <span className="friend-name">{friend.username}</span>
                          <span className="friend-meta-status">
                            <span className={`status-dot ${friend.status === 'online' ? 'status-dot--online' : 'status-dot--offline'}`} />
                            {friend.status === 'online' ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="friend-actions-btns">
                        <button 
                          className="btn-social-mini btn-chat-mini"
                          onClick={() => setActiveChatUser(friend)}
                          title="Abrir chat privado"
                        >
                          💬
                        </button>
                        <button 
                          className="btn-social-mini btn-profile-mini"
                          onClick={() => setSelectedProfileUser(friend)}
                          title="Ver perfil"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* TAB 2: USER SEARCH */}
              {socialTab === 'buscar' && (
                <>
                  <div className="social-search-row">
                    <input 
                      type="text" 
                      placeholder="Nombre de usuario..." 
                      className="social-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn-search-trigger" onClick={handleSearchUsers}>
                      Buscar
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                    {searchResults.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '11px', textAlign: 'center', marginTop: '10px' }}>
                        Introduce el nombre y dale a buscar.
                      </div>
                    ) : (
                      searchResults.map(user => (
                        <div key={user.user_id} className="user-search-item">
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{user.username}</span>
                          <button 
                            className="btn-social-mini btn-add-friend-mini"
                            onClick={() => handleSendFriendRequest(user)}
                          >
                            + Agregar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* TAB 3: PENDING REQUESTS */}
              {socialTab === 'requests' && (
                requests.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: '11px', textAlign: 'center', marginTop: '30px', fontStyle: 'italic' }}>
                    No tienes peticiones pendientes.
                  </div>
                ) : (
                  requests.map(reqName => (
                    <div key={reqName} className="friend-item">
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{reqName}</span>
                      <div>
                        <button 
                          className="btn-action-request btn-accept-req"
                          onClick={() => handleAcceptRequest(reqName)}
                        >
                          Aceptar
                        </button>
                        <button 
                          className="btn-action-request btn-decline-req"
                          onClick={() => handleDeclineRequest(reqName)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

            </div>
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

      {/* ---------- PROFILE DETAILS MODAL ---------- */}
      {selectedProfileUser && (
        <div className="profile-card-modal" onClick={() => setSelectedProfileUser(null)}>
          <div className="profile-card-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-card-avatar">
              🏆
            </div>
            <h3 className="profile-card-username">{selectedProfileUser.username}</h3>
            <span className="profile-card-rank">
              {selectedProfileUser.elo >= 1500 ? '🥇 Enbido Maisu' : selectedProfileUser.elo >= 1200 ? '🥈 Experto' : '🥉 Principiante'}
            </span>

            <div className="profile-card-details-grid">
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">Puntos ELO</span>
                <span className="profile-detail-val">{selectedProfileUser.elo}</span>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">Efectividad</span>
                <span className="profile-detail-val">
                  {selectedProfileUser.totalGamesPlayed > 0 
                    ? Math.round((selectedProfileUser.totalGamesWon / selectedProfileUser.totalGamesPlayed) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">Jugadas</span>
                <span className="profile-detail-val">{selectedProfileUser.totalGamesPlayed}</span>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">Ganadas</span>
                <span className="profile-detail-val">{selectedProfileUser.totalGamesWon}</span>
              </div>
            </div>

            <button 
              className="profile-card-close-btn"
              onClick={() => setSelectedProfileUser(null)}
            >
              Cerrar Perfil
            </button>
          </div>
        </div>
      )}

      {/* ---------- FLOATING CHAT WINDOW ---------- */}
      {activeChatUser && (
        <div className="chat-window-fixed">
          <header className="chat-window-header">
            <div className="chat-header-user">
              <span className="chat-header-dot" style={{ backgroundColor: activeChatUser.status === 'online' ? '#2ec4b6' : '#6b7280' }} />
              <span className="chat-header-name">Chat: {activeChatUser.username}</span>
            </div>
            <button className="chat-header-close-btn" onClick={() => setActiveChatUser(null)}>
              &times;
            </button>
          </header>
          
          <div className="chat-window-messages" ref={chatEndRef}>
            {chatMessages.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '10px', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
                No hay mensajes anteriores en este chat privado.
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div 
                    key={index} 
                    className={`chat-msg-row ${isMe ? 'chat-msg-row--sent' : 'chat-msg-row--received'}`}
                  >
                    <span style={{ display: 'block', fontWeight: 'bold', fontSize: '9px', marginBottom: '2px', color: isMe ? '#fac715' : '#4ade80' }}>
                      {msg.senderName}
                    </span>
                    {msg.content}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="chat-window-input-form">
            <input 
              type="text" 
              className="chat-window-input"
              placeholder="Escribe un mensaje..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              required
            />
            <button type="submit" className="chat-window-send-btn">
              Enviar
            </button>
          </form>
        </div>
      )}

      {/* ---------- LEADERBOARD MODAL ---------- */}
      {showLeaderboard && (
        <div className="leaderboard-modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
            
            {/* MODAL HEADER */}
            <header className="leaderboard-modal-header">
              <div className="leaderboard-title-group">
                <span style={{ fontSize: '28px' }}>🏆</span>
                <div>
                  <h2 className="leaderboard-modal-title">Clasificación General</h2>
                  <span className="leaderboard-modal-subtitle">Euskadi Mus Arena</span>
                </div>
              </div>
              <button className="leaderboard-close-x" onClick={() => setShowLeaderboard(false)}>
                &times;
              </button>
            </header>

            {/* PODIUM OF CHAMPIONS */}
            {!loadingLeaderboard && leaderboardData.length > 0 && (
              <div className="leaderboard-podium">
                {/* 2ND PLACE */}
                {leaderboardData.length >= 2 && (
                  <div className="podium-pillar pillar-second">
                    <div className="podium-medal">🥈</div>
                    <div className="podium-avatar">
                      {leaderboardData[1].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="podium-name">{leaderboardData[1].username}</div>
                    {leaderboardData[1].equippedTitle && leaderboardData[1].equippedTitle !== 'Sin Título' && (
                      <span className="podium-title-badge">{leaderboardData[1].equippedTitle}</span>
                    )}
                    <div className="podium-elo">{leaderboardData[1].elo} ELO</div>
                    <div className="podium-bar">2</div>
                  </div>
                )}

                {/* 1ST PLACE */}
                {leaderboardData.length >= 1 && (
                  <div className="podium-pillar pillar-first">
                    <div className="podium-crown">👑</div>
                    <div className="podium-medal">🥇</div>
                    <div className="podium-avatar">
                      {leaderboardData[0].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="podium-name">{leaderboardData[0].username}</div>
                    {leaderboardData[0].equippedTitle && leaderboardData[0].equippedTitle !== 'Sin Título' && (
                      <span className="podium-title-badge">{leaderboardData[0].equippedTitle}</span>
                    )}
                    <div className="podium-elo">{leaderboardData[0].elo} ELO</div>
                    <div className="podium-bar">1</div>
                  </div>
                )}

                {/* 3RD PLACE */}
                {leaderboardData.length >= 3 && (
                  <div className="podium-pillar pillar-third">
                    <div className="podium-medal">🥉</div>
                    <div className="podium-avatar">
                      {leaderboardData[2].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="podium-name">{leaderboardData[2].username}</div>
                    {leaderboardData[2].equippedTitle && leaderboardData[2].equippedTitle !== 'Sin Título' && (
                      <span className="podium-title-badge">{leaderboardData[2].equippedTitle}</span>
                    )}
                    <div className="podium-elo">{leaderboardData[2].elo} ELO</div>
                    <div className="podium-bar">3</div>
                  </div>
                )}
              </div>
            )}

            {/* FULL RANKING TABLE */}
            <div className="leaderboard-table-container">
              {loadingLeaderboard ? (
                <div className="leaderboard-loading">
                  <div className="lobby-loader"></div>
                  <p>Cargando clasificación de campeones...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="leaderboard-empty">No hay datos de clasificación disponibles.</div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Puesto</th>
                      <th>Jugador</th>
                      <th>Título</th>
                      <th>ELO</th>
                      <th>Win Rate</th>
                      <th>Jugadas</th>
                      <th>Ganadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((player, idx) => {
                      const isMe = player.userId === currentUserId;
                      let rankBadge = '';
                      if (idx === 0) rankBadge = '🥇';
                      else if (idx === 1) rankBadge = '🥈';
                      else if (idx === 2) rankBadge = '🥉';
                      
                      return (
                        <tr key={player.userId} className={`${isMe ? 'row-highlight-me' : ''}`}>
                          <td className="col-rank">
                            <span className="rank-number">{idx + 1}</span>
                            {rankBadge && <span className="rank-emoji">{rankBadge}</span>}
                          </td>
                          <td className="col-player">
                            <div className="player-cell">
                              <div className="player-avatar-small">
                                {player.username.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="player-username">{player.username}</span>
                              {isMe && <span className="me-badge">TÚ</span>}
                            </div>
                          </td>
                          <td className="col-title">
                            {player.equippedTitle && player.equippedTitle !== 'Sin Título' ? (
                              <span className="title-item-badge">{player.equippedTitle}</span>
                            ) : (
                              <span className="no-title-badge">-</span>
                            )}
                          </td>
                          <td className="col-elo">
                            <span className="elo-value">{player.elo} ELO</span>
                          </td>
                          <td className="col-winrate">
                            <div className="winrate-bar-container">
                              <span className="winrate-value">{player.winRate}%</span>
                              <div className="winrate-track">
                                <div className="winrate-fill" style={{ width: `${player.winRate}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="col-stats">{player.totalGamesPlayed}</td>
                          <td className="col-stats">{player.totalGamesWon}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PremiumLobby;
