import React, { useEffect, useState, useRef } from 'react';
import api from '../../../services/api';
import '../styles/premium-lobby.css';
import { useChatWebSocket } from '../../../context/ChatWebSocketContext';

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

  // WebSocket Chat Context Methods
  const { registerDmCallback, unregisterDmCallback, sendDirectMessage } = useChatWebSocket();

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

  // Estados de Doble Factor (2FA)
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [updating2Fa, setUpdating2Fa] = useState(false);

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

  // ---------- INITIALIZE PROFILE & SOCIAL & POLLING ----------
  useEffect(() => {
    fetchProfileData();
    fetchFriends();
    fetchRequests();
    fetchOnlineTournaments();

    // Cargar estado de 2FA
    api.get('/usuarios/me')
      .then(res => setTwoFactorEnabled(res.data.twoFactorEnabled || false))
      .catch(err => console.error('Error fetching 2FA status in lobby:', err));
  }, [currentUserId]);

  const handleToggle2Fa = async (enabled: boolean) => {
    setUpdating2Fa(true);
    try {
      const res = await api.post('/usuarios/me/2fa/toggle', { enabled });
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      alert(enabled ? '¡Autenticación de Doble Factor (2FA) activada con éxito!' : 'Autenticación de Doble Factor (2FA) desactivada.');
    } catch (err: any) {
      console.error('Error updating 2FA in lobby:', err);
      alert(err.response?.data?.error || 'Error al cambiar la configuración de 2FA');
    } finally {
      setUpdating2Fa(false);
    }
  };

  // Sincronizar chat con el usuario activo usando WebSockets reales en lugar de polling
  useEffect(() => {
    if (!activeChatUser) {
      unregisterDmCallback();
      return;
    }

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

    if (!activeChatUser.isBot) {
      // Registrar id para excluir notificaciones
      localStorage.setItem('enbido_active_chat_user_id', String(activeChatUser.id));

      registerDmCallback((newMsg: any) => {
        if (
          (newMsg.senderId === currentUserId && newMsg.receiverId === activeChatUser.id) ||
          (newMsg.senderId === activeChatUser.id && newMsg.receiverId === currentUserId)
        ) {
          setChatMessages(prev => {
            const exists = prev.some(m => m.timestamp === new Date(newMsg.sentAt).getTime() && m.content === newMsg.content);
            if (exists) return prev;

            return [...prev, {
              senderId: newMsg.senderId,
              senderName: newMsg.sender?.username || (newMsg.senderId === currentUserId ? activeUsername : activeChatUser.username),
              content: newMsg.content,
              timestamp: new Date(newMsg.sentAt).getTime()
            }];
          });
        }
      });
    }

    return () => {
      unregisterDmCallback();
      localStorage.removeItem('enbido_active_chat_user_id');
    };
  }, [activeChatUser, currentUserId, activeUsername, registerDmCallback, unregisterDmCallback]);

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
      sendDirectMessage(activeChatUser.id, msgText);
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

              <button
                className={`lobby-badge security-2fa-badge-btn ${twoFactorEnabled
                  ? 'security-2fa-badge-btn--enabled'
                  : 'security-2fa-badge-btn--disabled'
                  }`}
                onClick={() => setShow2FaModal(true)}
                title="Configuración de Seguridad (Doble Factor)"
              >
                <span className="badge-icon">🔑</span>
                <div className="badge-details">
                  <span
                    className={`badge-val ${twoFactorEnabled
                        ? 'security-2fa-badge-value--enabled'
                        : 'security-2fa-badge-value--disabled'
                      }`}
                  >                    {twoFactorEnabled ? '2FA Activo' : 'Activar 2FA'}
                  </span>
                  <span className="badge-lbl">Seguridad</span>
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
              <span className="panel-icon panel-icon--sm">👥</span>
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
                    className="lobby-column tourney-card"
                  >
                    <div className="tourney-card-header">
                      <span className={`tourney-card-status ${isPlaying ? 'tourney-card-status--playing' : isFinished ? 'tourney-card-status--finished' : 'tourney-card-status--open'}`}>
                        {isPlaying ? '⚡ En juego' : isFinished ? '🏆 Finalizado' : '📝 Abierto'}
                      </span>
                      <span className="tourney-card-platform">🌐 Online</span>
                    </div>

                    <h3 className="tourney-card-title">
                      {tourney.title || tourney.tournamentName}
                    </h3>

                    <div className="tourney-card-info">
                      <div>📍 <strong>Servidor:</strong> Enbido.eus Online</div>
                      <div>🗓️ <strong>Fecha:</strong> {tourney.startDatetime ? tourney.startDatetime.replace('T', ' ').substring(0, 16) : 'Por determinar'}</div>
                    </div>

                    <div className="tourney-card-prizes">
                      <div className="tourney-prize-col">
                        <span className="tourney-prize-label">ENTRADA</span>
                        <span className="tourney-prize-val tourney-prize-val--entry">💰 {tourney.coinsFee || 0} tx</span>
                      </div>
                      <div className="tourney-prize-col">
                        <span className="tourney-prize-label">PREMIO</span>
                        <span className="tourney-prize-val tourney-prize-val--reward">🏆 {tourney.coinsReward || 0} tx</span>
                      </div>
                    </div>

                    <button
                      className="btn-action tourney-card-btn"
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
              <span className={`chat-header-dot ${activeChatUser.status === 'online' ? 'chat-header-dot--online' : 'chat-header-dot--offline'}`} />
              <span className="chat-header-name">Chat: {activeChatUser.username}</span>
            </div>
            <button className="chat-header-close-btn" onClick={() => setActiveChatUser(null)}>
              &times;
            </button>
          </header>

          <div className="chat-window-messages" ref={chatEndRef}>
            {chatMessages.length === 0 ? (
              <div className="chat-window-empty">
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
                    <span className={`chat-msg-sender ${isMe ? 'chat-msg-sender--me' : 'chat-msg-sender--other'}`}>
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
                <span className="leaderboard-header-icon">🏆</span>
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
                      <th onClick={() => handleSort('elo')} className="sortable-header">
                        ELO {sortField === 'elo' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('winRate')} className="sortable-header">
                        Win Rate {sortField === 'winRate' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('totalGamesPlayed')} className="sortable-header">
                        Jugadas {sortField === 'totalGamesPlayed' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('totalGamesWon')} className="sortable-header">
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
                                {/* Justificado: El ancho de la barra de progreso de victorias se calcula dinámicamente en tiempo de ejecución. */}
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
          <div className="leaderboard-modal leaderboard-modal--rules" onClick={(e) => e.stopPropagation()}>
            <header className="leaderboard-modal-header">
              <div className="leaderboard-title-group">
                <span className="leaderboard-header-icon">🃏</span>
                <div>
                  <h2 className="leaderboard-modal-title">Mus Jokoaren Arauak</h2>
                  <span className="leaderboard-modal-subtitle">Reglas oficiales y guía de aprendizaje para jugar al Mus</span>
                </div>
              </div>
              <button className="leaderboard-close-x" onClick={() => setShowRulesModal(false)}>
                &times;
              </button>
            </header>

            <div className="rules-modal-body">
              {/* Zer da Mus-a */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>🃏</span> Zer da Mus-a? / ¿Qué es el Mus?
                </h3>
                <p className="rules-text">
                  El Mus es un juego de cartas tradicional de origen vasco, ampliamente jugado en toda España y partes de Hispanoamérica.
                  Se juega por parejas (4 jugadores en total) utilizando la baraja española de 40 cartas. El objetivo es llegar antes que la pareja rival a un número determinado de puntos (usualmente 30 u 40 puntos).
                </p>
                <p className="rules-note">
                  Musa bikoteka jokatu beharreko karta joko tradizionala da. Hogeita hamar edo berrogei puntutara jokatu ohi da, eta bikote bakoitzeko kideen arteko komunikazio isila (keinuak) funtsezkoa da garaipena lortzeko.
                </p>
              </div>

              {/* Los 4 lances */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>⚔️</span> Jokoaren Lantaldeak / Los 4 Lances de la Mano
                </h3>
                <p className="rules-text">
                  Cada mano de Mus consta de 4 lances consecutivos:
                </p>
                <div className="rules-grid-2col">
                  <div className="rules-card">
                    <h4 className="rules-card-title">1. Handia / La Grande</h4>
                    <p className="rules-card-text">
                      Gana la pareja con las cartas de mayor valor. Los Reyes y Caballos son las cartas más fuertes.
                    </p>
                  </div>
                  <div className="rules-card">
                    <h4 className="rules-card-title">2. Txikia / La Chica</h4>
                    <p className="rules-card-text">
                      Gana la pareja con las cartas de menor valor. Los Ases y doses son las mejores cartas.
                    </p>
                  </div>
                  <div className="rules-card">
                    <h4 className="rules-card-title">3. Pareak / Los Pares</h4>
                    <p className="rules-card-text">
                      Premios por tener cartas iguales. <strong>Par:</strong> dos iguales; <strong>Medias:</strong> tres iguales; <strong>Duples:</strong> cuatro iguales o dos parejas.
                    </p>
                  </div>
                  <div className="rules-card">
                    <h4 className="rules-card-title">4. Juego o Punto</h4>
                    <p className="rules-card-text">
                      Sumar las cartas. El mejor juego es 31 (Joko Nagusia). Si nadie llega a 31, se juega al Punto (siendo 30 el mejor).
                    </p>
                  </div>
                </div>
              </div>

              {/* Señas */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>🤫</span> Keinu Gida / Guía de Señas Permitidas
                </h3>
                <div className="rules-guide-grid">
                  {[
                    { emoji: '👄', name: 'Morder Labio Inferior', meaning: 'Dos Reyes' },
                    { emoji: '👅', name: 'Punta de la Lengua', meaning: 'Dos Ases' },
                    { emoji: '😉', name: 'Guiño de un Ojo', meaning: 'Medias (3 iguales)' },
                    { emoji: '🤨', name: 'Elevar las Cejas', meaning: 'Duples (2 parejas)' },
                    { emoji: '🤫', name: 'Ladear la Cabeza', meaning: '31 Puntos (Juego)' },
                    { emoji: '😑', name: 'Cerrar los Ojos', meaning: 'Ciego (Sin Juego)' }
                  ].map((s, i) => (
                    <div key={i} className="rules-guide-item">
                      <span className="rules-guide-emoji">{s.emoji}</span>
                      <div>
                        <div className="rules-guide-name">{s.name}</div>
                        <div className="rules-guide-meaning">{s.meaning}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variantes */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>⚙️</span> Arau Bertsioak / 4 Reyes vs 8 Reyes
                </h3>
                <div className="rules-variants-list">
                  <div className="rules-variant-card rules-variant-card--standard">
                    <strong className="rules-variant-title">8 Reyes (Estándar en Enbido.eus)</strong>
                    <p className="rules-variant-text">
                      Los 3es equivalen a Reyes y los 2es a Ases. Se juega en Vizcaya y Guipúzcoa. Esto acelera el ritmo y las manos fuertes de pares o juego.
                    </p>
                  </div>
                  <div className="rules-variant-card rules-variant-card--classic">
                    <strong className="rules-variant-title">4 Reyes (Clásica o Alavesa)</strong>
                    <p className="rules-variant-text">
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
        <div className="tourney-details-overlay">
          <div className="tourney-details-modal">
            {/* Close button */}
            <button
              onClick={() => { setSelectedTourneyId(null); setTourneyDetails(null); }}
              className="tourney-details-close-btn"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="tourney-details-header">
              <span className="tourney-details-subtitle">
                🌐 Torneo Online de Mus
              </span>
              <h2 className="tourney-details-title">
                {tourneyDetails.tournament.title || tourneyDetails.tournament.tournamentName}
              </h2>
            </div>

            {loadingTourneyDetails ? (
              <div className="tourney-details-loader-box">
                <div className="lobby-loader tourney-details-loader-spinner"></div>
                <p className="tourney-details-loader-text">Cargando eliminatorias del torneo...</p>
              </div>
            ) : (
              <>
                {/* DETAILS GRID */}
                <div className="tourney-metrics-grid">
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">INSCRIPCIÓN</span>
                    <span className="tourney-metric-value tourney-metric-value--fee">💰 {tourneyDetails.tournament.coinsFee || 0} tx</span>
                  </div>
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">RECOMPENSA CAMPEÓN</span>
                    <span className="tourney-metric-value tourney-metric-value--reward">🏆 {tourneyDetails.tournament.coinsReward || 0} tx</span>
                  </div>
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">AFORO</span>
                    <span className="tourney-metric-value">{tourneyDetails.participants.length} / {tourneyDetails.tournament.maxTeams || 8}</span>
                  </div>
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">ESTADO</span>
                    <span className={`tourney-metric-value--status ${tourneyDetails.tournament.status === 'finished'
                      ? 'tourney-metric-value--status-finished'
                      : tourneyDetails.tournament.status === 'playing'
                        ? 'tourney-metric-value--status-playing'
                        : 'tourney-metric-value--status-open'
                      }`}>
                      {tourneyDetails.tournament.status === 'open' ? 'Abierto' : tourneyDetails.tournament.status === 'playing' ? 'En juego' : 'Finalizado'}
                    </span>
                  </div>
                </div>

                {/* ACTION TRIGGERS (JOIN / START) */}
                {tourneyDetails.tournament.status === 'open' && (
                  <div className="tourney-actions-row">
                    {tourneyDetails.participants.some((p: any) => p.userId === currentUserId) ? (
                      <button className="tourney-btn-inscribed" disabled>
                        ✔ Ya estás inscrito en este torneo online
                      </button>
                    ) : (
                      <button className="btn-action tourney-btn-flex" onClick={handleJoinOnlineTournament}>
                        💰 Inscribirse por {tourneyDetails.tournament.coinsFee || 0} monedas (tx)
                      </button>
                    )}

                    {tourneyDetails.tournament.organizerId === currentUserId && (
                      <button
                        className="btn-action tourney-btn-admin-start"
                        onClick={handleStartOnlineTournament}
                        disabled={tourneyDetails.participants.length < 2}
                      >
                        ⚡ Iniciar Torneo y Generar Llaves (Admin)
                      </button>
                    )}
                  </div>
                )}

                {/* REGISTERED PLAYERS (IF OPEN) */}
                {tourneyDetails.tournament.status === 'open' && (
                  <div className="tourney-participants-section">
                    <h3 className="tourney-section-heading">Participantes Inscritos</h3>
                    {tourneyDetails.participants.length === 0 ? (
                      <p className="tourney-participants-empty">Aún no hay inscripciones para este torneo.</p>
                    ) : (
                      <div className="tourney-participants-list">
                        {tourneyDetails.participants.map((player: any) => (
                          <span key={player.userId} className={`tourney-participant-pill ${player.userId === currentUserId ? 'tourney-participant-pill--me' : ''}`}>
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
                    <h3 className="tourney-bracket-heading">Cuadro del Torneo / Brackets</h3>

                    <div className="tourney-bracket-tree">

                      {/* ROUND 1: QUARTERFINALS */}
                      {tourneyDetails.matches.some((m: any) => m.roundNumber === 1) && (
                        <div className="bracket-round-column">
                          <span className="bracket-round-label">Cuartos de Final</span>
                          {tourneyDetails.matches.filter((m: any) => m.roundNumber === 1).map((match: any) => {
                            const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                            const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                            const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                            const isActive = !match.winnerId && match.player1Id && match.player2Id;

                            return (
                              <div key={match.matchId} className={`bracket-match-box ${reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                                <div className={`bracket-player-row ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                                  <span>{getTourneyUsernameById(match.player1Id)}</span>
                                  {isWinner1 && <span>✔</span>}
                                </div>
                                <div className="bracket-divider" />
                                <div className={`bracket-player-row ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                                  <span>{getTourneyUsernameById(match.player2Id)}</span>
                                  {isWinner2 && <span>✔</span>}
                                </div>
                                {match.score && (
                                  <div className="bracket-score">Resultado: {match.score}</div>
                                )}
                                {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                  <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} className="bracket-report-icon-btn" title="Reportar Ganador">
                                    ✎
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ROUND 2: SEMIFINALS */}
                      <div className="bracket-round-column bracket-round-column--semis">
                        <span className="bracket-round-label">Semifinales</span>
                        {tourneyDetails.matches.filter((m: any) => m.roundNumber === 2).map((match: any) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;

                          return (
                            <div key={match.matchId} className={`bracket-match-box ${reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                              <div className={`bracket-player-row ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                                <span>{getTourneyUsernameById(match.player1Id)}</span>
                                {isWinner1 && <span>✔</span>}
                              </div>
                              <div className="bracket-divider" />
                              <div className={`bracket-player-row ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                                <span>{getTourneyUsernameById(match.player2Id)}</span>
                                {isWinner2 && <span>✔</span>}
                              </div>
                              {match.score && (
                                <div className="bracket-score">Resultado: {match.score}</div>
                              )}
                              {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} className="bracket-report-icon-btn" title="Reportar Ganador">
                                  ✎
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ROUND 3: GRAND FINAL */}
                      <div className="bracket-round-column bracket-round-column--final">
                        <span className="bracket-round-label">Gran Final</span>
                        {tourneyDetails.matches.filter((m: any) => m.roundNumber === 3).map((match: any) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;
                          const championId = match.winnerId;

                          return (
                            <div key={match.matchId} className={`bracket-match-box bracket-match-box--final ${championId ? 'bracket-match-box--championship' : reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                              {championId && <span className="bracket-match-champion-tag">👑 ¡Campeón!</span>}
                              <div className={`bracket-player-row bracket-player-row--final ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                                <span>{getTourneyUsernameById(match.player1Id)}</span>
                                {isWinner1 && <span>🏆</span>}
                              </div>
                              <div className="bracket-divider bracket-divider--final" />
                              <div className={`bracket-player-row bracket-player-row--final ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                                <span>{getTourneyUsernameById(match.player2Id)}</span>
                                {isWinner2 && <span>🏆</span>}
                              </div>
                              {match.score && (
                                <div className="bracket-score bracket-score--final">Resultado: {match.score}</div>
                              )}
                              {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} className="bracket-report-icon-btn" title="Reportar Ganador">
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
                      <form onSubmit={handleReportOnlineWinnerSubmit} className="bracket-report-form">
                        <h4 className="bracket-report-form-title">✎ Registrar Resultado de Partida</h4>

                        <div className="bracket-report-row">
                          <div className="bracket-report-field-group">
                            <label className="bracket-report-label">SELECCIONAR GANADOR</label>
                            <select
                              value={reportWinnerId || ''}
                              onChange={(e) => setReportWinnerId(Number(e.target.value))}
                              className="bracket-report-select"
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

                          <div className="bracket-report-field-group bracket-report-field-group--score">
                            <label className="bracket-report-label">MARCADOR</label>
                            <input
                              type="text"
                              value={reportScore}
                              onChange={(e) => setReportScore(e.target.value)}
                              placeholder="3-0"
                              className="bracket-report-input"
                            />
                          </div>

                          <div className="bracket-report-actions">
                            <button type="submit" className="btn-action bracket-report-btn-save" disabled={!reportWinnerId}>
                              Guardar
                            </button>
                            <button type="button" onClick={() => setReportingMatchId(null)} className="bracket-report-btn-cancel">
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

      {/* ---------- MODAL CONFIGURACIÓN 2FA ---------- */}
      {show2FaModal && (
        <div className="leaderboard-modal-overlay" onClick={() => setShow2FaModal(false)}>
          <div className="leaderboard-modal leaderboard-modal--2fa" onClick={(e) => e.stopPropagation()} >
            <header className="leaderboard-modal-header">
              <div className="leaderboard-title-group">
                <span className="security-modal-icon">🔑</span>
                <div>
                  <h2 className="leaderboard-modal-title">Seguridad de la Cuenta</h2>
                  <span className="leaderboard-modal-subtitle">Configuración de acceso seguro</span>
                </div>
              </div>
              <button className="leaderboard-close-x" onClick={() => setShow2FaModal(false)}>
                &times;
              </button>
            </header>

            <div className="security-modal-body">
              <div className="security-card">
                <div className="security-card-content">
                  <h4 className="security-card-title">
                    Doble Factor por Email (2FA)
                  </h4>
                  <p className="security-card-description">
                    Al iniciar sesión se enviará un código de verificación temporal a tu correo registrado.
                  </p>
                </div>

                <div className="security-switch-container">
                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      disabled={updating2Fa}
                      onChange={(e) => handleToggle2Fa(e.target.checked)}
                      className="switch-input"
                    />
                    <span
                      className={`slider round ${twoFactorEnabled ? 'slider--active' : ''
                        } ${updating2Fa ? 'slider--disabled' : ''
                        }`}
                    >
                      <span
                        className={`slider-knob ${twoFactorEnabled ? 'slider-knob--active' : ''
                          }`}
                      />
                    </span>
                  </label>
                </div>
              </div>

              <div className="security-modal-actions">
                <button
                  className="btn-action security-modal-close-btn"
                  onClick={() => setShow2FaModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PremiumLobby;
