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
  const [sortField, setSortField] = useState<'elo' | 'winRate' | 'totalGamesPlayed' | 'totalGamesWon'>('elo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [onlineTournaments, setOnlineTournaments] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [selectedTourneyId, setSelectedTourneyId] = useState<number | null>(null);
  const [tourneyDetails, setTourneyDetails] = useState<any>(null);
  const [loadingTourneyDetails, setLoadingTourneyDetails] = useState(false);

  // Reporting states
  const [reportingMatchId, setReportingMatchId] = useState<number | null>(null);
  const [reportWinnerId, setReportWinnerId] = useState<number | null>(null);
  const [reportScore, setReportScore] = useState<string>('3-0');

  const fetchOnlineTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const res = await api.get('/tournaments');
      setOnlineTournaments(res.data);
    } catch (err) {
      console.error('Error fetching online tournaments:', err);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const handleOpenTourneyDetail = async (id: number) => {
    setSelectedTourneyId(id);
    setLoadingTourneyDetails(true);
    try {
      const res = await api.get(`/tournaments/${id}/details`);
      setTourneyDetails(res.data);
    } catch (err) {
      console.error('Error fetching tourney details:', err);
    } finally {
      setLoadingTourneyDetails(false);
    }
  };

  const handleJoinOnlineTournament = async () => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/join`);
      alert('¡Inscripción al torneo online realizada con éxito!');
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
      fetchProfileData();
    } catch (err: any) {
      console.error('Error joining online tournament:', err);
      alert(err.response?.data || 'Error al inscribirse. Comprueba tus monedas.');
    }
  };

  const handleStartOnlineTournament = async () => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/start`);
      alert('¡Torneo online iniciado y brackets de eliminatorias generados!');
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
    } catch (err: any) {
      console.error('Error starting online tournament:', err);
      alert(err.response?.data || 'Error al iniciar.');
    }
  };

  const handleReportOnlineWinnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourneyId || !reportingMatchId || !reportWinnerId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/matches/${reportingMatchId}/report`, null, {
        params: {
          winnerId: reportWinnerId,
          score: reportScore
        }
      });
      alert('Marcador de partida reportado con éxito.');
      setReportingMatchId(null);
      setReportWinnerId(null);
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
    } catch (err: any) {
      console.error('Error reporting match score:', err);
      alert(err.response?.data || 'Error al reportar.');
    }
  };

  const getTourneyUsernameById = (id: number | null): string => {
    if (!id || !tourneyDetails) return 'Esperando...';
    const match = tourneyDetails.participants.find((p: any) => p.userId === id);
    return match ? match.username : `Jugador-${id}`;
  };

  const handleSort = (field: 'elo' | 'winRate' | 'totalGamesPlayed' | 'totalGamesWon') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    const valA = a[sortField] || 0;
    const valB = b[sortField] || 0;
    if (valA === valB) {
      return (b.elo || 0) - (a.elo || 0); // Tie breaker by ELO
    }
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const getSortedValueString = (player: UserLeaderboardDto) => {
    switch (sortField) {
      case 'winRate':
        return `${player.winRate}% Win Rate`;
      case 'totalGamesPlayed':
        return `${player.totalGamesPlayed} Partidas`;
      case 'totalGamesWon':
        return `${player.totalGamesWon} Ganadas`;
      case 'elo':
      default:
        return `${player.elo} ELO`;
    }
  };

  // ---------- SOCIAL STATES ----------
  interface PendingRequest {
    friendshipId: number;
    username: string;
    type: 'received' | 'sent';
  }

  const [socialTab, setSocialTab] = useState<'amigos' | 'buscar' | 'requests'>('amigos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);

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

  const defaultBots: Friend[] = [
    { id: -1, username: 'MusLar-99', elo: 1420, totalGamesPlayed: 120, totalGamesWon: 74, status: 'online', isBot: true },
    { id: -2, username: 'AnderMus', elo: 1100, totalGamesPlayed: 45, totalGamesWon: 20, status: 'online', isBot: true },
    { id: -3, username: 'AmaiaTxapeldun', elo: 1650, totalGamesPlayed: 250, totalGamesWon: 160, status: 'offline', isBot: true }
  ];

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friendships');
      setFriends([...defaultBots, ...res.data]);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends(defaultBots);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/friendships/pending');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/usuarios/me/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching player profile from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- INITIALIZE PROFILE & SOCIAL ----------
  useEffect(() => {
    fetchProfileData();
    fetchFriends();
    fetchRequests();
    fetchOnlineTournaments();
  }, [currentUserId]);

  // Sincronizar chat con el usuario activo (con polling para usuarios reales en DB)
  useEffect(() => {
    if (!activeChatUser) return;

    const loadChat = async () => {
      if (activeChatUser.isBot) {
        const key = `enbido_chat_with_${currentUserId}_and_${activeChatUser.id}`;
        const savedMsgs = localStorage.getItem(key);
        setChatMessages(savedMsgs ? JSON.parse(savedMsgs) : []);
      } else {
        try {
          const res = await api.get(`/messages/${activeChatUser.id}`);
          const mapped = res.data.map((m: any) => ({
            senderId: m.senderId,
            senderName: m.senderId === currentUserId ? activeUsername : activeChatUser.username,
            content: m.content,
            timestamp: new Date(m.sentAt).getTime()
          }));
          setChatMessages(mapped);
        } catch (err) {
          console.error('Error loading chat messages from DB:', err);
        }
      }
    };

    loadChat();

    // Auto-scroll al final del chat
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
      }
    }, 100);

    let intervalId: any;
    if (!activeChatUser.isBot) {
      intervalId = setInterval(loadChat, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeChatUser, currentUserId, activeUsername]);

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

        const exists = friends.find(f => f.username === parsed.username);
        if (exists) {
          setActiveChatUser(exists);
        } else {
          // Agregar al amigo enviando solicitud en backend
          api.post(`/friendships/request/${parsed.username}`)
            .then(() => {
              fetchFriends();
              fetchRequests();
            })
            .catch(err => console.error(err));

          const newFriend: Friend = {
            id: parsed.id,
            username: parsed.username,
            elo: parsed.elo || 1000,
            totalGamesPlayed: parsed.totalGamesPlayed || 0,
            totalGamesWon: parsed.totalGamesWon || 0,
            status: 'online'
          };
          setActiveChatUser(newFriend);
        }
      }
    };

    const interval = setInterval(checkExternalChat, 500);
    return () => clearInterval(interval);
  }, [friends, currentUserId]);

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

  const handleSendFriendRequest = async (targetUser: any) => {
    const isAlreadyFriend = friends.some(f => f.username === targetUser.username);
    if (isAlreadyFriend) {
      alert('Ya tienes agregado o pendiente a este jugador.');
      return;
    }

    try {
      const res = await api.post(`/friendships/request/${targetUser.username}`);
      alert(res.data.message || 'Solicitud de amistad enviada.');
      fetchRequests();
      fetchFriends();
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      alert(err.response?.data?.error || 'Error al enviar solicitud');
    }
  };

  const handleAcceptRequest = async (req: PendingRequest) => {
    try {
      await api.post(`/friendships/accept/${req.friendshipId}`);
      alert('Solicitud de amistad aceptada.');
      fetchFriends();
      fetchRequests();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      alert(err.response?.data?.error || 'Error al aceptar solicitud');
    }
  };

  const handleDeclineRequest = async (req: PendingRequest) => {
    try {
      await api.post(`/friendships/decline/${req.friendshipId}`);
      alert('Solicitud rechazada/cancelada.');
      fetchRequests();
    } catch (err: any) {
      console.error('Error declining request:', err);
      alert(err.response?.data?.error || 'Error al rechazar solicitud');
    }
  };

  // ---------- CHAT ACTIONS & BOT AUTO-REPLY ----------
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;

    const msgText = chatInput.trim();
    setChatInput('');

    if (activeChatUser.isBot) {
      const myMsg: ChatMessage = {
        senderId: currentUserId,
        senderName: activeUsername,
        content: msgText,
        timestamp: Date.now()
      };

      const updatedMsgs = [...chatMessages, myMsg];
      setChatMessages(updatedMsgs);

      const key = `enbido_chat_with_${currentUserId}_and_${activeChatUser.id}`;
      localStorage.setItem(key, JSON.stringify(updatedMsgs));

      setTimeout(() => {
        let botResponseContent = '';
        if (activeChatUser.id === -1) {
          const replies = [
            '¡Hola! ¿Echamos unas manos a 8 Reyes? Abre una sala y pásame el código. ⚔️',
            'Recuerda: morder el labio inferior es tener dos Reyes. ¡Usa las señas! 🤫',
            '¡Envido a pares! ¿Qué me dices?',
            'Hoy tengo duples seguro. No me busques las cosquillas...'
          ];
          botResponseContent = replies[Math.floor(Math.random() * replies.length)];
        } else if (activeChatUser.id === -2) {
          const replies = [
            'Kaixo! Zabaldu mahaia eta sartuko naiz! 🚪',
            'Gran partida la de ayer. ¿Has visto las señas en el menú de Reglas?',
            'Aupa mutil! Jokatuko dugu gero?',
            'Tengo una mano buenísima. ¿Hacemos órdago?'
          ];
          botResponseContent = replies[Math.floor(Math.random() * replies.length)];
        } else if (activeChatUser.id === -3) {
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

    } else {
      try {
        const res = await api.post(`/messages/${activeChatUser.id}`, { content: msgText });
        const newMsg: ChatMessage = {
          senderId: res.data.senderId,
          senderName: activeUsername,
          content: res.data.content,
          timestamp: new Date(res.data.sentAt).getTime()
        };
        setChatMessages(prev => [...prev, newMsg]);
      } catch (err) {
        console.error('Error sending private message:', err);
      }
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
              <button
                className="lobby-badge rules-trigger-btn"
                onClick={() => setShowRulesModal(true)}
                title="Aprender a jugar al Mus"
              >
                <span className="badge-icon">🃏</span>
                <div className="badge-details">
                  <span className="badge-val">Reglas / Keinus</span>
                  <span className="badge-lbl">Guía de Juego</span>
                </div>
              </button>
            </div>
          )}
        </header>

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
                <div className="reyes-selector">
                  <label className="reyes-selector-label">REGLAS DE REYES:</label>
                  <div className="reyes-selector-options">
                    <button
                      type="button"
                      onClick={() => setSelectedReyes('8')}
                      className={`reyes-option ${selectedReyes === '8'
                        ? 'reyes-option--active'
                        : 'reyes-option--inactive'
                        }`}
                    >
                      👑 8 Reyes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReyes('4')}
                      className={`reyes-option ${selectedReyes === '4'
                        ? 'reyes-option--active'
                        : 'reyes-option--inactive'
                        }`}
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
                  <div className="social-empty-state social-empty-state--large">
                    Aún no tienes amigos agregados.
                  </div>
                ) : (
                  friends.map(friend => (
                    <div key={friend.id} className="friend-item">
                      <div className="friend-info-block">
                        <div className="friend-avatar-circle">
                          {friend.username.substring(0, 2).toUpperCase()}
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
                  <div className="search-results-list">
                    {searchResults.length === 0 ? (
                      <div className="social-empty-state social-empty-state--small">
                        Introduce el nombre y dale a buscar.
                      </div>
                    ) : (
                      searchResults.map(user => (
                        <div key={user.user_id} className="user-search-item">
                          <span className="search-result-username">
                            {user.username}
                          </span>
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
                  <div className="social-empty-state social-empty-state--large">
                    No tienes peticiones pendientes.
                  </div>
                ) : (
                  requests.map(req => (
                    <div
                      key={req.friendshipId}
                      className="friend-item friend-item--request"
                    >
                      <div className="request-header">
                        <span className="request-username">{req.username}</span>
                        <span className="request-status">
                          {req.type === 'received' ? 'Te ha enviado solicitud' : 'Solicitud enviada'}
                        </span>
                      </div>
                      {req.type === 'received' ? (
                        <div className="request-actions">
                          <button
                            className="btn-action-request btn-accept-req request-btn"
                            onClick={() => handleAcceptRequest(req)}
                          >
                            Aceptar
                          </button>
                          <button
                            className="btn-action-request btn-decline-req request-btn"
                            onClick={() => handleDeclineRequest(req)}
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-action-request btn-decline-req request-btn-full request-btn-cancel"
                          onClick={() => handleDeclineRequest(req)}
                        >
                          Cancelar Solicitud
                        </button>
                      )}
                    </div>
                  ))
                )
              )}

            </div>
          </section>

        </div>

        {/* SEPARATOR FOR ONLINE TOURNAMENTS */}
        <div className="tournaments-separator" />

        {/* COLUMN / VIEW: ONLINE TOURNAMENTS LIST */}
        <div className="tournaments-section">
          <div className="tournaments-header">
            <div>
              <h2 className="tournaments-title">🏆 Torneos Online de Mus</h2>
              <p className="tournaments-subtitle">
                Inscríbete usando tus monedas, compite en eliminatorias directas y gana el gran premio.
              </p>
            </div>
            <button
              onClick={fetchOnlineTournaments}
              className="btn-action tournaments-refresh-btn"
            >
              🔄 Actualizar Lista
            </button>
          </div>

          {loadingTournaments ? (
            <div className="tournaments-loading">
              <div className="lobby-loader"></div>
              <p className="tournaments-loading-text">Cargando torneos online...</p>
            </div>
          ) : onlineTournaments.length === 0 ? (
            <div className="tournaments-empty">
              <span className="tournaments-empty-icon">🎫</span>
              <h3 className="tournaments-empty-title">No hay torneos online programados</h3>
              <p className="tournaments-empty-text">
                Los administradores programan torneos en fechas especiales. Vuelve a consultar más tarde.
              </p>
            </div>
          ) : (
         <div className="tournaments-grid">
              {onlineTournaments.map((tourney) => {
                const isPlaying = tourney.status === 'playing';
                const isFinished = tourney.status === 'finished';
                return (
                  <div
                    key={tourney.id || tourney.tournamentId}
                    onClick={() => handleOpenTourneyDetail(tourney.id || tourney.tournamentId)}
                    className="lobby-column"
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      alignItems: 'stretch',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      transition: 'transform 0.2s, border-color 0.2s',
                      height: 'auto'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        backgroundColor: isPlaying ? 'rgba(245, 158, 11, 0.15)' : isFinished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: isPlaying ? '#fbbf24' : isFinished ? '#34d399' : '#60a5fa'
                      }}>
                        {isPlaying ? '⚡ En juego' : isFinished ? '🏆 Finalizado' : '📝 Abierto'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>🌐 Online</span>
                    </div>

                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
                      {tourney.title || tourney.tournamentName}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '15px' }}>
                      <div>📍 <strong>Servidor:</strong> Enbido.eus Online</div>
                      <div>🗓️ <strong>Fecha:</strong> {tourney.startDatetime ? tourney.startDatetime.replace('T', ' ').substring(0, 16) : 'Por determinar'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: '#888' }}>ENTRADA</span>
                        <span style={{ color: '#fac715', fontWeight: 'bold', fontSize: '0.85rem' }}>💰 {tourney.coinsFee || 0} tx</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '0.65rem', color: '#888' }}>PREMIO</span>
                        <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.85rem' }}>🏆 {tourney.coinsReward || 0} tx</span>
                      </div>
                    </div>

                    <button
                      className="btn-action"
                      style={{ width: '100%', padding: '10px 0', fontSize: '0.75rem', marginTop: '5px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTourneyDetail(tourney.id || tourney.tournamentId);
                      }}
                    >
                      {isFinished ? 'Ver Campeón y Brackets' : 'Ver Brackets / Inscribirse'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
            {!loadingLeaderboard && sortedLeaderboard.length > 0 && (
              <div className="leaderboard-podium">
                {/* 2ND PLACE */}
                {sortedLeaderboard.length >= 2 && (
                  <div className="podium-pillar pillar-second">
                    <div className="podium-medal">🥈</div>
                    <div className="podium-avatar">
                      {sortedLeaderboard[1].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="podium-name">{sortedLeaderboard[1].username}</div>
                    {sortedLeaderboard[1].equippedTitle && sortedLeaderboard[1].equippedTitle !== 'Sin Título' && (
                      <span className="podium-title-badge">{sortedLeaderboard[1].equippedTitle}</span>
                    )}
                    <div className="podium-elo">{getSortedValueString(sortedLeaderboard[1])}</div>
                    <div className="podium-bar">2</div>
                  </div>
                )}

                {/* 1ST PLACE */}
                {sortedLeaderboard.length >= 1 && (
                  <div className="podium-pillar pillar-first">
                    <div className="podium-crown">👑</div>
                    <div className="podium-medal">🥇</div>
                    <div className="podium-avatar">
                      {sortedLeaderboard[0].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="podium-name">{sortedLeaderboard[0].username}</div>
                    {sortedLeaderboard[0].equippedTitle && sortedLeaderboard[0].equippedTitle !== 'Sin Título' && (
                      <span className="podium-title-badge">{sortedLeaderboard[0].equippedTitle}</span>
                    )}
                    <div className="podium-elo">{getSortedValueString(sortedLeaderboard[0])}</div>
                    <div className="podium-bar">1</div>
                  </div>
                )}

                {/* 3RD PLACE */}
                {sortedLeaderboard.length >= 3 && (
                  <div className="podium-pillar pillar-third">
                    <div className="podium-medal">🥉</div>
                    <div className="podium-avatar">
                      {sortedLeaderboard[2].username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="podium-name">{sortedLeaderboard[2].username}</div>
                    {sortedLeaderboard[2].equippedTitle && sortedLeaderboard[2].equippedTitle !== 'Sin Título' && (
                      <span className="podium-title-badge">{sortedLeaderboard[2].equippedTitle}</span>
                    )}
                    <div className="podium-elo">{getSortedValueString(sortedLeaderboard[2])}</div>
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
              ) : sortedLeaderboard.length === 0 ? (
                <div className="leaderboard-empty">No hay datos de clasificación disponibles.</div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Puesto</th>
                      <th>Jugador</th>
                      <th>Título</th>
                      <th onClick={() => handleSort('elo')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                        ELO {sortField === 'elo' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('winRate')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                        Win Rate {sortField === 'winRate' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('totalGamesPlayed')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                        Jugadas {sortField === 'totalGamesPlayed' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('totalGamesWon')} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
                        Ganadas {sortField === 'totalGamesWon' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeaderboard.map((player, idx) => {
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

      {/* ---------- RULES MODAL ---------- */}
      {showRulesModal && (
        <div className="leaderboard-modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <header className="leaderboard-modal-header">
              <div className="leaderboard-title-group">
                <span style={{ fontSize: '28px' }}>🃏</span>
                <div>
                  <h2 className="leaderboard-modal-title">Mus Jokoaren Arauak</h2>
                  <span className="leaderboard-modal-subtitle">Reglas oficiales y guía de aprendizaje para jugar al Mus</span>
                </div>
              </div>
              <button className="leaderboard-close-x" onClick={() => setShowRulesModal(false)}>
                &times;
              </button>
            </header>

            <div className="leaderboard-table-container" style={{ padding: '20px', color: '#ccc', maxHeight: '65vh', overflowY: 'auto', display: 'block' }}>
              {/* Zer da Mus-a */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#d4af37', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>🃏</span> Zer da Mus-a? / ¿Qué es el Mus?
                </h3>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 8px 0', color: '#ddd' }}>
                  El Mus es un juego de cartas tradicional de origen vasco, ampliamente jugado en toda España y partes de Hispanoamérica.
                  Se juega por parejas (4 jugadores en total) utilizando la baraja española de 40 cartas. El objetivo es llegar antes que la pareja rival a un número determinado de puntos (usualmente 30 u 40 puntos).
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.5', margin: '0', color: '#999', fontStyle: 'italic' }}>
                  Musa bikoteka jokatu beharreko karta joko tradizionala da. Hogeita hamar edo berrogei puntutara jokatu ohi da, eta bikote bakoitzeko kideen arteko komunikazio isila (keinuak) funtsezkoa da garaipena lortzeko.
                </p>
              </div>

              {/* Los 4 lances */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#d4af37', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>⚔️</span> Jokoaren Lantaldeak / Los 4 Lances de la Mano
                </h3>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '12px', color: '#ddd' }}>
                  Cada mano de Mus consta de 4 lances consecutivos:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 4px 0', fontWeight: 600 }}>1. Handia / La Grande</h4>
                    <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                      Gana la pareja con las cartas de mayor valor. Los Reyes y Caballos son las cartas más fuertes.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 4px 0', fontWeight: 600 }}>2. Txikia / La Chica</h4>
                    <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                      Gana la pareja con las cartas de menor valor. Los Ases y doses son las mejores cartas.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 4px 0', fontWeight: 600 }}>3. Pareak / Los Pares</h4>
                    <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                      Premios por tener cartas iguales. <strong>Par:</strong> dos iguales; <strong>Medias:</strong> tres iguales; <strong>Duples:</strong> cuatro iguales o dos parejas.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 4px 0', fontWeight: 600 }}>4. Juego o Punto</h4>
                    <p style={{ fontSize: '0.78rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                      Sumar las cartas. El mejor juego es 31 (Joko Nagusia). Si nadie llega a 31, se juega al Punto (siendo 30 el mejor).
                    </p>
                  </div>
                </div>
              </div>

              {/* Señas */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#d4af37', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>🤫</span> Keinu Gida / Guía de Señas Permitidas
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { emoji: '👄', name: 'Morder Labio Inferior', meaning: 'Dos Reyes' },
                    { emoji: '👅', name: 'Punta de la Lengua', meaning: 'Dos Ases' },
                    { emoji: '😉', name: 'Guiño de un Ojo', meaning: 'Medias (3 iguales)' },
                    { emoji: '🤨', name: 'Elevar las Cejas', meaning: 'Duples (2 parejas)' },
                    { emoji: '🤫', name: 'Ladear la Cabeza', meaning: '31 Puntos (Juego)' },
                    { emoji: '😑', name: 'Cerrar los Ojos', meaning: 'Ciego (Sin Juego)' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', background: '#151515', padding: '8px 10px', borderRadius: '8px', border: '1px solid #222', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px' }}>{s.emoji}</span>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#fff' }}>{s.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#d4af37' }}>{s.meaning}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variantes */}
              <div>
                <h3 style={{ color: '#d4af37', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>⚙️</span> Arau Bertsioak / 4 Reyes vs 8 Reyes
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#111', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #d4af37' }}>
                    <strong style={{ display: 'block', fontSize: '0.8rem', color: '#fff', marginBottom: '2px' }}>8 Reyes (Estándar en Enbido.eus)</strong>
                    <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                      Los 3es equivalen a Reyes y los 2es a Ases. Se juega en Vizcaya y Guipúzcoa. Esto acelera el ritmo y las manos fuertes de pares o juego.
                    </p>
                  </div>
                  <div style={{ background: '#111', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #666' }}>
                    <strong style={{ display: 'block', fontSize: '0.8rem', color: '#fff', marginBottom: '2px' }}>4 Reyes (Clásica o Alavesa)</strong>
                    <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0, lineHeight: 1.4 }}>
                      Los 3es y 2es valen sus puntos normales. Las manos fuertes son escasas y requiere un juego más pausado y estratégico.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL DETALLES TORNEO ONLINE (CON BRACKETS) ---------- */}
      {selectedTourneyId && tourneyDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0d1510',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => { setSelectedTourneyId(null); setTourneyDetails(null); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                borderStyle: 'solid'
              }}
            >
              ✕
            </button>

            {/* Header info */}
            <div style={{ marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px' }}>
              <span style={{ fontSize: '0.8rem', color: '#fac715', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                🌐 Torneo Online de Mus
              </span>
              <h2 style={{ margin: '5px 0 0 0', fontSize: '1.8rem', color: '#fff', fontWeight: 800 }}>
                {tourneyDetails.tournament.title || tourneyDetails.tournament.tournamentName}
              </h2>
            </div>

            {loadingTourneyDetails ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="lobby-loader" style={{ margin: '0 auto 10px auto' }}></div>
                <p style={{ color: '#888' }}>Cargando eliminatorias del torneo...</p>
              </div>
            ) : (
              <>
                {/* DETAILS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>INSCRIPCIÓN</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fac715' }}>💰 {tourneyDetails.tournament.coinsFee || 0} tx</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>RECOMPENSA CAMPEÓN</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>🏆 {tourneyDetails.tournament.coinsReward || 0} tx</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>AFORO</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{tourneyDetails.participants.length} / {tourneyDetails.tournament.maxTeams || 8}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>ESTADO</span>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: tourneyDetails.tournament.status === 'finished' ? '#4ade80' : tourneyDetails.tournament.status === 'playing' ? '#fac715' : '#aaa', textTransform: 'uppercase' }}>
                      {tourneyDetails.tournament.status === 'open' ? 'Abierto' : tourneyDetails.tournament.status === 'playing' ? 'En juego' : 'Finalizado'}
                    </span>
                  </div>
                </div>

                {/* ACTION TRIGGERS (JOIN / START) */}
                {tourneyDetails.tournament.status === 'open' && (
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
                    {tourneyDetails.participants.some((p: any) => p.userId === currentUserId) ? (
                      <button className="btn-action" disabled style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#777', flex: 1, cursor: 'not-allowed', boxShadow: 'none' }}>
                        ✔ Ya estás inscrito en este torneo online
                      </button>
                    ) : (
                      <button className="btn-action" onClick={handleJoinOnlineTournament} style={{ flex: 1 }}>
                        💰 Inscribirse por {tourneyDetails.tournament.coinsFee || 0} monedas (tx)
                      </button>
                    )}

                    {tourneyDetails.tournament.organizerId === currentUserId && (
                      <button
                        className="btn-action"
                        onClick={handleStartOnlineTournament}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                        disabled={tourneyDetails.participants.length < 2}
                      >
                        ⚡ Iniciar Torneo y Generar Llaves (Admin)
                      </button>
                    )}
                  </div>
                )}

                {/* REGISTERED PLAYERS (IF OPEN) */}
                {tourneyDetails.tournament.status === 'open' && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Participantes Inscritos</h3>
                    {tourneyDetails.participants.length === 0 ? (
                      <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#6b7280' }}>Aún no hay inscripciones para este torneo.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {tourneyDetails.participants.map((player: any) => (
                          <span key={player.userId} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: player.userId === currentUserId ? '#fac715' : '#fff', fontWeight: player.userId === currentUserId ? 'bold' : 'normal' }}>
                            👤 {player.username} {player.userId === currentUserId && '(Tú)'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ---------- VISUAL BRACKET TREE ---------- */}
                {(tourneyDetails.tournament.status === 'playing' || tourneyDetails.tournament.status === 'finished') && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Cuadro del Torneo / Brackets</h3>

                    <div style={{ display: 'flex', gap: '30px', overflowX: 'auto', paddingBottom: '15px', minHeight: '320px', alignItems: 'center' }}>

                      {/* ROUND 1: QUARTERFINALS */}
                      {tourneyDetails.matches.some((m: any) => m.roundNumber === 1) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minWidth: '180px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textAlign: 'center', display: 'block', textTransform: 'uppercase', marginBottom: '5px' }}>Cuartos de Final</span>
                          {tourneyDetails.matches.filter((m: any) => m.roundNumber === 1).map((match: any) => {
                            const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                            const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                            const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                            const isActive = !match.winnerId && match.player1Id && match.player2Id;

                            return (
                              <div key={match.matchId} style={{ background: 'rgba(0,0,0,0.3)', border: reportingMatchId === match.matchId ? '1px solid #fac715' : '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner1 ? '#fac715' : '#fff', fontWeight: isWinner1 ? 'bold' : 'normal' }}>
                                  <span>{getTourneyUsernameById(match.player1Id)}</span>
                                  {isWinner1 && <span>✔</span>}
                                </div>
                                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', margin: '6px 0' }} />
                                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner2 ? '#fac715' : '#fff', fontWeight: isWinner2 ? 'bold' : 'normal' }}>
                                  <span>{getTourneyUsernameById(match.player2Id)}</span>
                                  {isWinner2 && <span>✔</span>}
                                </div>
                                {match.score && (
                                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px', textAlign: 'right' }}>Resultado: {match.score}</div>
                                )}
                                {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                  <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', background: '#fac715', color: '#000', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', borderStyle: 'solid' }} title="Reportar Ganador">
                                    ✎
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ROUND 2: SEMIFINALS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', flex: 1, minWidth: '180px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textAlign: 'center', display: 'block', textTransform: 'uppercase', marginBottom: '5px' }}>Semifinales</span>
                        {tourneyDetails.matches.filter((m: any) => m.roundNumber === 2).map((match: any) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;

                          return (
                            <div key={match.matchId} style={{ background: 'rgba(0,0,0,0.3)', border: reportingMatchId === match.matchId ? '1px solid #fac715' : '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner1 ? '#fac715' : '#fff', fontWeight: isWinner1 ? 'bold' : 'normal' }}>
                                <span>{getTourneyUsernameById(match.player1Id)}</span>
                                {isWinner1 && <span>✔</span>}
                              </div>
                              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', margin: '6px 0' }} />
                              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner2 ? '#fac715' : '#fff', fontWeight: isWinner2 ? 'bold' : 'normal' }}>
                                <span>{getTourneyUsernameById(match.player2Id)}</span>
                                {isWinner2 && <span>✔</span>}
                              </div>
                              {match.score && (
                                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px', textAlign: 'right' }}>Resultado: {match.score}</div>
                              )}
                              {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', background: '#fac715', color: '#000', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', borderStyle: 'solid' }} title="Reportar Ganador">
                                  ✎
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ROUND 3: GRAND FINAL */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', flex: 1, minWidth: '180px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textAlign: 'center', display: 'block', textTransform: 'uppercase', marginBottom: '5px' }}>Gran Final</span>
                        {tourneyDetails.matches.filter((m: any) => m.roundNumber === 3).map((match: any) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;
                          const championId = match.winnerId;

                          return (
                            <div key={match.matchId} style={{ background: 'rgba(212, 175, 55, 0.04)', border: championId ? '2px solid #fac715' : reportingMatchId === match.matchId ? '1px solid #fac715' : '1px solid rgba(255,255,255,0.15)', padding: '15px', borderRadius: '12px', position: 'relative', boxShadow: championId ? '0 0 15px rgba(250, 199, 21, 0.25)' : 'none' }}>
                              {championId && <span style={{ fontSize: '16px', display: 'block', textAlign: 'center', marginBottom: '8px' }}>👑 ¡Campeón!</span>}
                              <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', color: isWinner1 ? '#fac715' : '#fff', fontWeight: isWinner1 ? 'bold' : 'normal' }}>
                                <span>{getTourneyUsernameById(match.player1Id)}</span>
                                {isWinner1 && <span>🏆</span>}
                              </div>
                              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }} />
                              <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', color: isWinner2 ? '#fac715' : '#fff', fontWeight: isWinner2 ? 'bold' : 'normal' }}>
                                <span>{getTourneyUsernameById(match.player2Id)}</span>
                                {isWinner2 && <span>🏆</span>}
                              </div>
                              {match.score && (
                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px', textAlign: 'right' }}>Resultado: {match.score}</div>
                              )}
                              {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', background: '#fac715', color: '#000', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', borderStyle: 'solid' }} title="Reportar Ganador">
                                  ✎
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* ---------- FLOATING REPORT SCORE PANEL ---------- */}
                    {reportingMatchId && (
                      <form onSubmit={handleReportOnlineWinnerSubmit} style={{ marginTop: '20px', background: 'rgba(250, 199, 21, 0.05)', border: '1px solid rgba(250, 199, 21, 0.25)', padding: '15px', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#fac715', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✎ Registrar Resultado de Partida</h4>

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>SELECCIONAR GANADOR</label>
                            <select
                              value={reportWinnerId || ''}
                              onChange={(e) => setReportWinnerId(Number(e.target.value))}
                              style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                              <option value="">-- Seleccionar --</option>
                              {tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player1Id && (
                                <option value={tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player1Id || ''}>
                                  {getTourneyUsernameById(tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player1Id || null)}
                                </option>
                              )}
                              {tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player2Id && (
                                <option value={tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player2Id || ''}>
                                  {getTourneyUsernameById(tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player2Id || null)}
                                </option>
                              )}
                            </select>
                          </div>

                          <div style={{ width: '100px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>MARCADOR</label>
                            <input
                              type="text"
                              value={reportScore}
                              onChange={(e) => setReportScore(e.target.value)}
                              placeholder="3-0"
                              style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" className="btn-action" style={{ padding: '8px 15px', fontSize: '0.8rem', boxShadow: 'none' }} disabled={!reportWinnerId}>
                              Guardar
                            </button>
                            <button type="button" onClick={() => setReportingMatchId(null)} style={{ padding: '8px 15px', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default PremiumLobby;
