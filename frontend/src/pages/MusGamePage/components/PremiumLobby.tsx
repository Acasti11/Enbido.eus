import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import '../styles/premium-lobby.css';
import { useTranslation } from 'react-i18next';
import { useChatWebSocket } from '../../../context/ChatWebSocketContext';
import { useChat } from '../../../context/ChatContext';

interface ParticipantInfo {
  userId: number;
  username: string;
}

interface MatchInfo {
  matchId: number;
  tournamentId: number;
  roundNumber: number;
  matchIndex: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  score: string;
  player1Ready?: boolean;
  player2Ready?: boolean;
  roundStartTime?: string;
  isCompleted?: boolean;
  gameRoomId?: string;
}

interface TournamentBackendDto {
  tournamentId: number;
  id?: number;
  title: string;
  tournamentName?: string;
  city: string;
  specificLocation: string;
  startDatetime: string;
  entryFee: number;
  maxTeams: number;
  status: string;
  coinsFee: number;
  coinsReward: number;
  organizerId: number;
  organizer: {
    email: string;
  } | null;
  posterImage?: string;
}

interface TournamentDetails {
  tournament: TournamentBackendDto;
  participants: ParticipantInfo[];
  matches: MatchInfo[];
}

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
  friendshipId?: number;
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

const defaultBots: Friend[] = [
  { id: -1, username: 'MusLar-99', elo: 1420, totalGamesPlayed: 120, totalGamesWon: 74, status: 'online', isBot: true },
  { id: -2, username: 'AnderMus', elo: 1100, totalGamesPlayed: 45, totalGamesWon: 20, status: 'online', isBot: true },
  { id: -3, username: 'AmaiaTxapeldun', elo: 1650, totalGamesPlayed: 250, totalGamesWon: 160, status: 'offline', isBot: true }
];

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
  const { t } = useTranslation();
  const activeUsername = localStorage.getItem('username') || t('shop.defaultUsername');

  // WebSocket Chat Context Methods
  const {
    registerFriendshipCallback,
    unregisterFriendshipCallback
  } = useChatWebSocket();

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

  const [onlineTournaments, setOnlineTournaments] = useState<TournamentBackendDto[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [selectedTourneyId, setSelectedTourneyId] = useState<number | null>(null);
  const [tourneyDetails, setTourneyDetails] = useState<TournamentDetails | null>(null);
  const [loadingTourneyDetails, setLoadingTourneyDetails] = useState(false);

  // Reporting states
  const [reportingMatchId, setReportingMatchId] = useState<number | null>(null);
  const [reportWinnerId, setReportWinnerId] = useState<number | null>(null);
  const [reportScore, setReportScore] = useState<string>('3-0');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);



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
      alert(t('premiumLobby.tournamentJoinSuccess'));
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
      fetchProfileData();
    } catch (err: unknown) {
      console.error('Error joining online tournament:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || t('premiumLobby.tournamentJoinError'));
    }
  };

  const handleStartOnlineTournament = async () => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/start`);
      alert(t('premiumLobby.tournamentStartSuccess'));
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
    } catch (err: unknown) {
      console.error('Error starting online tournament:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || t('premiumLobby.tournamentStartError'));
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
      alert(t('premiumLobby.reportSuccess'));
      setReportingMatchId(null);
      setReportWinnerId(null);
      handleOpenTourneyDetail(selectedTourneyId);
      fetchOnlineTournaments();
    } catch (err: unknown) {
      console.error('Error reporting match score:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || t('premiumLobby.reportError'));
    }
  };

  const handleReadyUp = async (matchId: number) => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/matches/${matchId}/ready`);
      handleOpenTourneyDetail(selectedTourneyId);
    } catch (err: unknown) {
      console.error('Error marking match as ready:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || 'Error al confirmar listo');
    }
  };

  const handleCancelReady = async (matchId: number) => {
    if (!selectedTourneyId) return;
    try {
      await api.post(`/tournaments/${selectedTourneyId}/matches/${matchId}/cancel-ready`);
      handleOpenTourneyDetail(selectedTourneyId);
    } catch (err: unknown) {
      console.error('Error cancelling match ready:', err);
      const axiosError = err as { response?: { data?: string } };
      alert(axiosError.response?.data || 'Error al cancelar listo');
    }
  };

  const getTourneyUsernameById = (id: number | null): string => {
    if (!id || !tourneyDetails) return t('premiumLobby.waitingEllipsis');
    const match = tourneyDetails.participants.find((p: any) => p.userId === id);
    return match ? match.username : t('premiumLobby.playerId', { id });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        return t('premiumLobby.winRateValue', { value: player.winRate });
      case 'totalGamesPlayed':
        return t('premiumLobby.gamesPlayedValue', { value: player.totalGamesPlayed });
      case 'totalGamesWon':
        return t('premiumLobby.gamesWonValue', { value: player.totalGamesWon });
      case 'elo':
      default:
        return t('premiumLobby.eloValue', { value: player.elo });
    }
  };

  // ---------- SOCIAL STATES ----------
  interface PendingRequest {
    friendshipId: number;
    username: string;
    type: 'received' | 'sent';
  }

  interface SearchUserDto {
    user_id: number;
    username: string;
    elo?: number;
  }
  const [socialTab, setSocialTab] = useState<'friends' | 'search' | 'requests' | 'blocked'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserDto[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);

  // Profile overlay
  const [selectedProfileUser, setSelectedProfileUser] = useState<Friend | null>(null);

  // Global chat context
  const { openChat } = useChat();

  const handleOpenChat = (friend: Friend) => {
    openChat({
      id: friend.id,
      username: friend.username,
      status: friend.status,
      isBot: friend.isBot
    });
  };

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

  const fetchFriends = useCallback(async () => {
    try {
      const res = await api.get('/friendships');
      setFriends([...defaultBots, ...res.data]);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends(defaultBots);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/friendships/pending');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const res = await api.get('/friendships/blocked');
      setBlockedUsers(res.data);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  }, []);

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

  }, [currentUserId, fetchFriends, fetchRequests]);

  // Load blocked users when blocked tab is active
  useEffect(() => {
    if (socialTab === 'blocked') {
      fetchBlockedUsers();
    }
  }, [socialTab, fetchBlockedUsers]);

  // Handle friendship and presence WebSocket events in real-time
  useEffect(() => {
    registerFriendshipCallback((event: any) => {
      const { type } = event;
      if (type === 'PRESENCE_CHANGE') {
        const { userId, status } = event;
        setFriends(prev => prev.map(f => {
          if (f.id === userId) {
            return { ...f, status };
          }
          return f;
        }));
      }
      else if (type === 'FRIEND_REQUEST_RECEIVED') {
        fetchRequests();
      }
      else if (type === 'FRIEND_REQUEST_ACCEPTED') {
        fetchFriends();
        fetchRequests();
      }
      else if (type === 'FRIEND_DELETED') {
        fetchFriends();
        fetchRequests();
      }
      else if (type === 'FRIEND_BLOCKED') {
        fetchFriends();
        fetchRequests();
        fetchBlockedUsers();
      }
      else if (type === 'FRIEND_UNBLOCKED') {
        fetchFriends();
        fetchBlockedUsers();
      }
    });

    return () => {
      unregisterFriendshipCallback();
    };
  }, [
    registerFriendshipCallback,
    unregisterFriendshipCallback,
    fetchFriends,
    fetchRequests,
    fetchBlockedUsers
  ]);

  // Find active match for the current player
  const activeMatch = tourneyDetails?.matches.find((m: any) =>
    !m.isCompleted &&
    (m.player1Id === currentUserId || m.player2Id === currentUserId)
  );

  // Poll tournament details every 3 seconds if modal is open
  useEffect(() => {
    if (!selectedTourneyId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/tournaments/${selectedTourneyId}/details`);
        setTourneyDetails(res.data);
      } catch (err) {
        console.error('Error polling tournament details:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTourneyId]);

  // Live timer countdown for the active match
  useEffect(() => {
    if (!activeMatch || !activeMatch.roundStartTime) {
      setSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const startTime = new Date(activeMatch.roundStartTime!).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = 300 - elapsed;
      setSecondsLeft(remaining > 0 ? remaining : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeMatch?.roundStartTime]);

  // Auto-redirect when both players are ready (gameRoomId is set)
  useEffect(() => {
    if (activeMatch && activeMatch.gameRoomId) {
      onJoinRoom(activeMatch.gameRoomId);
    }
  }, [activeMatch?.gameRoomId, onJoinRoom]);

  const handleDeleteFriend = async (friend: Friend) => {
    const confirmMsg = t('premiumLobby.confirmDelete', { username: friend.username });
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/friendships/${friend.friendshipId}`);
      fetchFriends();
    } catch (err: any) {
      console.error('Error deleting friend:', err);
      alert(err.response?.data?.error || t('premiumLobby.errorDeleteFriend'));
    }
  };

  const handleBlockUser = async (friend: Friend) => {
    const confirmMsg = t('premiumLobby.confirmBlock', { username: friend.username });
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/friendships/block/${friend.id}`);
      fetchFriends();
      // Chat will be closed by GlobalChatWindow if needed
    } catch (err: any) {
      console.error('Error blocking user:', err);
      alert(err.response?.data?.error || t('premiumLobby.errorBlockUser'));
    }
  };

  const handleUnblockUser = async (blockedUser: Friend) => {
    try {
      await api.post(`/friendships/unblock/${blockedUser.id}`);
      fetchBlockedUsers();
    } catch (err: any) {
      console.error('Error unblocking user:', err);
      alert(err.response?.data?.error || t('premiumLobby.errorUnblockUser'));
    }
  };

  // ---------- SOCIAL ACTIONS ----------
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get('/usuarios');
      // Filtrar la lista de usuarios en base a la query (excluyendo el usuario propio)
      const matches = res.data.filter((u: { username: string }) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        u.username !== activeUsername
      );
      setSearchResults(matches);
    } catch (err) {
      console.error('Error searching registered users:', err);
    }
  };

  const handleSendFriendRequest = async (targetUser: { username: string }) => {
    const isAlreadyFriend = friends.some(f => f.username === targetUser.username);
    if (isAlreadyFriend) {
      alert(t('premiumLobby.alreadyFriend'));
      return;
    }

    try {
      const res = await api.post(`/friendships/request/${targetUser.username}`);
      alert(res.data.message || t('premiumLobby.friendRequestSent'));
      fetchRequests();
      fetchFriends();
    } catch (err: unknown) {
      console.error('Error sending friend request:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || t('premiumLobby.errorSendRequest'));
    }
  };

  const handleAcceptRequest = async (req: PendingRequest) => {
    try {
      await api.post(`/friendships/accept/${req.friendshipId}`);
      alert(t('premiumLobby.friendRequestAccepted'));
      fetchFriends();
      fetchRequests();
    } catch (err: unknown) {
      console.error('Error accepting friend request:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || t('premiumLobby.errorAcceptRequest'));
    }
  };

  const handleDeclineRequest = async (req: PendingRequest) => {
    try {
      await api.post(`/friendships/decline/${req.friendshipId}`);
      alert(t('premiumLobby.requestDeclined'));
      fetchRequests();
    } catch (err: unknown) {
      console.error('Error declining request:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || t('premiumLobby.errorDeclineRequest'));
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
            <span className="welcome-tag">{t('premiumLobby.registeredPlayer')}</span>
            <h1 className="welcome-title">{t('premiumLobby.hello', { username })}</h1>
          </div>

          {/* USER STATS BADGES */}
          {!loading && profile && (
            <div className="header-badges">
              <div className="lobby-badge elo-badge">
                <span className="badge-icon">📊</span>
                <div className="badge-details">
                  <span className="badge-val">{profile.elo} ELO</span>
                  <span className="badge-lbl">{t('premiumLobby.rankPoints')}</span>
                </div>
              </div>
              <div className="lobby-badge coins-badge">
                <span className="badge-icon">💰</span>
                <div className="badge-details">
                  <span className="badge-val">{profile.coins}</span>
                  <span className="badge-lbl">{t('premiumLobby.goldCoins')}</span>
                </div>
              </div>
              <button
                className="lobby-badge leaderboard-trigger-btn"
                onClick={handleOpenLeaderboard}
                title={t("premiumLobby.viewRanking")}
              >
                <span className="badge-icon">🏆</span>
                <div className="badge-details">
                  <span className="badge-val">{t('premiumLobby.viewRanking')}</span>
                  <span className="badge-lbl">{t('premiumLobby.ranking')}</span>
                </div>
              </button>
              <button
                className="lobby-badge rules-trigger-btn"
                onClick={() => setShowRulesModal(true)}
                title={t("premiumLobby.gameGuide")}
              >
                <span className="badge-icon">🃏</span>
                <div className="badge-details">
                  <span className="badge-val">{t('premiumLobby.rulesKeinus')}</span>
                  <span className="badge-lbl">{t('premiumLobby.gameGuide')}</span>
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
              <h2>{t('premiumLobby.matchFinder')}</h2>
            </div>
            <p className="panel-desc">{t('premiumLobby.matchFinderDesc')}</p>

            {isSearching ? (
              <div className="search-spinner-area">
                <div className="lobby-loader"></div>
                <p className="searching-lbl">{t('premiumLobby.searchingOpponents')}</p>
                {queueSize > 0 && <p className="queue-size-lbl">{t('premiumLobby.queueSize', { count: queueSize })}</p>}
                <button className="cancel-search-btn" onClick={onCancelMatchmaking}>
                  {t('premiumLobby.cancelSearch')}
                </button>
              </div>
            ) : (
              <>
                <div className="reyes-selector">
                  <label className="reyes-selector-label">{t('premiumLobby.kingsRules')}</label>
                  <div className="reyes-selector-options">
                    <button
                      type="button"
                      onClick={() => setSelectedReyes('8')}
                      className={`reyes-option ${selectedReyes === '8'
                        ? 'reyes-option--active'
                        : 'reyes-option--inactive'
                        }`}
                    >
                      {t('lobby.kings8')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReyes('4')}
                      className={`reyes-option ${selectedReyes === '4'
                        ? 'reyes-option--active'
                        : 'reyes-option--inactive'
                        }`}
                    >
                      {t('lobby.kings4')}
                    </button>
                  </div>
                </div>
                <button className="join-queue-btn" onClick={() => onStartMatchmaking(selectedReyes)}>
                  {t('premiumLobby.searchMatch')}
                </button>
              </>
            )}
          </section>

          {/* COLUMN 2: CUSTOM ROOMS */}
          <section className="lobby-column private-rooms-panel">
            <div className="panel-glow-header">
              <span className="panel-icon">🔑</span>
              <h2>{t('premiumLobby.privateRooms')}</h2>
            </div>
            <p className="panel-desc">{t('premiumLobby.privateRoomsDesc')}</p>

            <button className="create-room-btn" onClick={handleCreateRoomLocal}>
              {t('premiumLobby.createNewRoom')}
            </button>

            <div className="divider-or"><span>{t('premiumLobby.or')}</span></div>

            <form onSubmit={handleJoinRoomLocal} className="join-room-form">
              <input
                type="text"
                placeholder={t("premiumLobby.roomCode")}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="room-code-input"
                maxLength={10}
                required
              />
              <button type="submit" className="join-room-submit-btn">
                {t('premiumLobby.joinTable')}
              </button>
            </form>
          </section>

          {/* COLUMN 3: SOCIAL & FRIENDS PANEL */}
          <section className="social-panel" aria-label="Social y Amigos">
            <div className="social-header-box">
              <span className="panel-icon panel-icon--sm">👥</span>
              <h2>{t('premiumLobby.communityFriends')}</h2>
            </div>

            {/* TABS HEADER */}
            <div className="social-tabs">
              <button
                className={`social-tab-btn ${socialTab === 'friends' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('friends')}
              >
                {t('premiumLobby.friendsCount', { count: friends.length })}
              </button>
              <button
                className={`social-tab-btn ${socialTab === 'search' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('search')}
              >
                {t('premiumLobby.search')}
              </button>
              <button
                className={`social-tab-btn ${socialTab === 'requests' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('requests')}
              >
                {t('premiumLobby.requestsCount', { count: requests.length })}
              </button>
              <button
                className={`social-tab-btn ${socialTab === 'blocked' ? 'social-tab-btn--active' : ''}`}
                onClick={() => setSocialTab('blocked')}
              >
                {t('premiumLobby.blockedCount', { count: blockedUsers.length })}
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="social-content-area">

              {/* TAB 1: FRIENDS LIST */}
              {socialTab === 'friends' && (
                friends.length === 0 ? (
                  <div className="social-empty-state social-empty-state--large">
                    {t('premiumLobby.noFriends')}
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
                            {friend.status === 'online' ? t('premiumLobby.online') : t('premiumLobby.offline')}
                          </span>
                        </div>
                      </div>

                      <div className="friend-actions-btns">
                        <button
                          className="btn-social-mini btn-chat-mini"
                          onClick={() => handleOpenChat(friend)}
                          title={t("premiumLobby.openChat")}
                        >
                          💬
                        </button>
                        <button
                          className="btn-social-mini btn-profile-mini"
                          onClick={() => setSelectedProfileUser(friend)}
                          title={t("premiumLobby.viewProfile")}
                        >
                          👁️
                        </button>
                        {!friend.isBot && (
                          <>
                            <button
                              className="btn-social-mini btn-delete-mini"
                              onClick={() => handleDeleteFriend(friend)}
                              title={t("premiumLobby.deleteFriend")}
                            >
                              ❌
                            </button>
                            <button
                              className="btn-social-mini btn-block-mini"
                              onClick={() => handleBlockUser(friend)}
                              title={t("premiumLobby.blockUser")}
                            >
                              🚫
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* TAB 2: USER SEARCH */}
              {socialTab === 'search' && (
                <>
                  <div className="social-search-row">
                    <input
                      type="text"
                      placeholder={t("premiumLobby.usernamePlaceholder")}
                      className="social-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn-search-trigger" onClick={handleSearchUsers}>
                      {t('premiumLobby.search')}
                    </button>
                  </div>
                  <div className="search-results-list">
                    {searchResults.length === 0 ? (
                      <div className="social-empty-state social-empty-state--small">
                        {t('premiumLobby.searchPrompt')}
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
                            {t('premiumLobby.add')}
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
                    {t('premiumLobby.noRequests')}
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
                          {req.type === 'received' ? t('premiumLobby.sentRequest') : t('premiumLobby.requestSent')}
                        </span>
                      </div>
                      {req.type === 'received' ? (
                        <div className="request-actions">
                          <button
                            className="btn-action-request btn-accept-req request-btn"
                            onClick={() => handleAcceptRequest(req)}
                          >
                            {t('premiumLobby.accept')}
                          </button>
                          <button
                            className="btn-action-request btn-decline-req request-btn"
                            onClick={() => handleDeclineRequest(req)}
                          >
                            {t('premiumLobby.decline')}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-action-request btn-decline-req request-btn-full request-btn-cancel"
                          onClick={() => handleDeclineRequest(req)}
                        >
                          {t('premiumLobby.cancelRequest')}
                        </button>
                      )}
                    </div>
                  ))
                )
              )}

              {/* TAB 4: BLOCKED USERS */}
              {socialTab === 'blocked' && (
                blockedUsers.length === 0 ? (
                  <div className="social-empty-state social-empty-state--large">
                    {t('premiumLobby.noBlocked')}
                  </div>
                ) : (
                  blockedUsers.map(blocked => (
                    <div key={blocked.id} className="friend-item">
                      <div className="friend-info-block">
                        <div className="friend-avatar-circle friend-avatar-circle--blocked">
                          🚫
                        </div>
                        <div className="friend-details">
                          <span className="friend-name">{blocked.username}</span>
                          <span className="friend-meta-status">{t('premiumLobby.blockedTab')}</span>
                        </div>
                      </div>
                      <div className="friend-actions-btns">
                        <button
                          className="btn-social-mini btn-unblock-mini"
                          onClick={() => handleUnblockUser(blocked)}
                        >
                          {t('premiumLobby.unblockUser')}
                        </button>
                      </div>
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
              <h2 className="tournaments-title">{t('premiumLobby.tournamentsTitle')}</h2>
              <p className="tournaments-subtitle">
                {t('premiumLobby.tournamentsDesc')}
              </p>
            </div>
            <button
              onClick={fetchOnlineTournaments}
              className="btn-action tournaments-refresh-btn"
            >
              {t('premiumLobby.updateList')}
            </button>
          </div>

          {loadingTournaments ? (
            <div className="tournaments-loading">
              <div className="lobby-loader"></div>
              <p className="tournaments-loading-text">{t('premiumLobby.loadingTournaments')}</p>
            </div>
          ) : onlineTournaments.length === 0 ? (
            <div className="tournaments-empty">
              <span className="tournaments-empty-icon">🎫</span>
              <h3 className="tournaments-empty-title">{t('premiumLobby.noTournaments')}</h3>
              <p className="tournaments-empty-text">
                {t('premiumLobby.noTournamentsDesc')}
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
                        {isPlaying ? t('premiumLobby.inGame') : isFinished ? t('premiumLobby.finished') : t('premiumLobby.open')}
                      </span>
                      <span className="tourney-card-platform">{t('premiumLobby.onlineLabel')}</span>
                    </div>

                    <h3 className="tourney-card-title">
                      {tourney.title || tourney.tournamentName}
                    </h3>

                    <div className="tourney-card-info">
                      <div>📍 <strong>{t('premiumLobby.server')}</strong> Enbido.eus Online</div>
                      <div>🗓️ <strong>{t('premiumLobby.date')}</strong> {tourney.startDatetime ? tourney.startDatetime.replace('T', ' ').substring(0, 16) : t('tournament.determineLater')}</div>
                    </div>

                    <div className="tourney-card-prizes">
                      <div className="tourney-prize-col">
                        <span className="tourney-prize-label">{t('premiumLobby.entry')}</span>
                        <span className="tourney-prize-val tourney-prize-val--entry">💰 {tourney.coinsFee || 0} tx</span>
                      </div>
                      <div className="tourney-prize-col">
                        <span className="tourney-prize-label">{t('premiumLobby.prize')}</span>
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
                      {isFinished ? t('premiumLobby.viewChampionBrackets') : t('premiumLobby.viewBracketsRegister')}
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
              <span className="stat-label">{t('premiumLobby.gamesPlayed')}</span>
              <span className="stat-value">{profile.totalGamesPlayed}</span>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">{t('premiumLobby.gamesWon')}</span>
              <span className="stat-value">{profile.totalGamesWon}</span>
            </div>
            <div className="footer-stat-item">
              <span className="stat-label">{t('premiumLobby.winRate')}</span>
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
              {selectedProfileUser.elo >= 1500 ? t('premiumLobby.rankEnbidoMaisu') : selectedProfileUser.elo >= 1200 ? t('premiumLobby.rankExpert') : t('premiumLobby.rankBeginner')}
            </span>

            <div className="profile-card-details-grid">
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">{t('premiumLobby.eloPoints')}</span>
                <span className="profile-detail-val">{selectedProfileUser.elo}</span>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">{t('premiumLobby.effectiveness')}</span>
                <span className="profile-detail-val">
                  {selectedProfileUser.totalGamesPlayed > 0
                    ? Math.round((selectedProfileUser.totalGamesWon / selectedProfileUser.totalGamesPlayed) * 100)
                    : 0}%
                </span>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">{t('premiumLobby.played')}</span>
                <span className="profile-detail-val">{selectedProfileUser.totalGamesPlayed}</span>
              </div>
              <div className="profile-detail-box">
                <span className="profile-detail-lbl">{t('premiumLobby.won')}</span>
                <span className="profile-detail-val">{selectedProfileUser.totalGamesWon}</span>
              </div>
            </div>

            <button
              className="profile-card-close-btn"
              onClick={() => setSelectedProfileUser(null)}
            >
              {t('premiumLobby.closeProfile')}
            </button>
          </div>
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
                  <h2 className="leaderboard-modal-title">{t('premiumLobby.leaderboardTitle')}</h2>
                  <span className="leaderboard-modal-subtitle">{t('premiumLobby.leaderboardSubtitle')}</span>
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
                  <p>{t('premiumLobby.loadingLeaderboard')}</p>
                </div>
              ) : sortedLeaderboard.length === 0 ? (
                <div className="leaderboard-empty">{t('premiumLobby.noLeaderboardData')}</div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>{t('premiumLobby.position')}</th>
                      <th>{t('premiumLobby.player')}</th>
                      <th>{t('premiumLobby.title')}</th>
                      <th onClick={() => handleSort('elo')} className="sortable-header">
                        ELO {sortField === 'elo' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('winRate')} className="sortable-header">
                        {t('premiumLobby.winRateShort')} {sortField === 'winRate' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('totalGamesPlayed')} className="sortable-header">
                        {t('premiumLobby.playedShort')} {sortField === 'totalGamesPlayed' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
                      </th>
                      <th onClick={() => handleSort('totalGamesWon')} className="sortable-header">
                        {t('premiumLobby.wonShort')} {sortField === 'totalGamesWon' ? (sortDirection === 'desc' ? '▼' : '▲') : '↕'}
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
                              {isMe && <span className="me-badge">{t('premiumLobby.you')}</span>}
                            </div>
                          </td>
                          <td className="col-title">
                            {player.equippedTitle && player.equippedTitle !== t('premiumLobby.noTitle') ? (
                              <span className="title-item-badge">{player.equippedTitle}</span>
                            ) : (
                              <span className="no-title-badge">{t('premiumLobby.noTitle')}</span>
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
                  <h2 className="leaderboard-modal-title">{t('premiumLobby.rulesTitle')}</h2>
                  <span className="leaderboard-modal-subtitle">{t('premiumLobby.rulesSubtitle')}</span>
                </div>
              </div>
              <button className="leaderboard-close-x" onClick={() => setShowRulesModal(false)}>
                &times;
              </button>
            </header>

            <div className="rules-modal-body">
              {/* What is Mus */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>🃏</span> {t('premiumLobby.rulesWhatIsMus')}
                </h3>
                <p className="rules-text">
                  {t('premiumLobby.whatIsMusAnswer')}
                </p>
                <p className="rules-note">
                  {t('premiumLobby.musNote')}
                </p>
              </div>

              {/* The 4 rounds */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>⚔️</span> {t('premiumLobby.rules4Lances')}
                </h3>
                <p className="rules-text">
                  {t('premiumLobby.lancesIntro')}
                </p>
                <div className="rules-grid-2col">
                  <div className="rules-card">
                    <h4 className="rules-card-title">{t('premiumLobby.grandeCardTitle')}</h4>
                    <p className="rules-card-text">
                      {t('premiumLobby.grandeCardText')}
                    </p>
                  </div>
                  <div className="rules-card">
                    <h4 className="rules-card-title">{t('premiumLobby.chicaCardTitle')}</h4>
                    <p className="rules-card-text">
                      {t('premiumLobby.chicaCardText')}
                    </p>
                  </div>
                  <div className="rules-card">
                    <h4 className="rules-card-title">{t('premiumLobby.paresCardTitle')}</h4>
                    <p className="rules-card-text">
                      {t('premiumLobby.paresCardText')}
                    </p>
                  </div>
                  <div className="rules-card">
                    <h4 className="rules-card-title">{t('premiumLobby.juegoCardTitle')}</h4>
                    <p className="rules-card-text">
                      {t('premiumLobby.juegoCardText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signs */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>🤫</span> {t('premiumLobby.rulesSignsGuide')}
                </h3>
                <div className="rules-guide-grid">
                  {[
                    { emoji: '👄', nameKey: 'premiumLobby.biteLowerLip', meaningKey: 'premiumLobby.signMeaningReyes' },
                    { emoji: '👅', nameKey: 'premiumLobby.tongueTip', meaningKey: 'premiumLobby.signMeaningAses' },
                    { emoji: '😉', nameKey: 'premiumLobby.winkEye', meaningKey: 'premiumLobby.signMeaningMedias' },
                    { emoji: '🤨', nameKey: 'premiumLobby.raiseEyebrows', meaningKey: 'premiumLobby.signMeaningDuples' },
                    { emoji: '🤫', nameKey: 'premiumLobby.tiltHead', meaningKey: 'premiumLobby.signMeaning31' },
                    { emoji: '😑', nameKey: 'premiumLobby.closeEyes', meaningKey: 'premiumLobby.signMeaningCiego' }
                  ].map((s, i) => (
                    <div key={i} className="rules-guide-item">
                      <span className="rules-guide-emoji">{s.emoji}</span>
                      <div>
                        <div className="rules-guide-name">{t(s.nameKey)}</div>
                        <div className="rules-guide-meaning">{t(s.meaningKey)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="rules-section">
                <h3 className="rules-section-title">
                  <span>⚙️</span> {t('premiumLobby.rulesVariants')}
                </h3>
                <div className="rules-variants-list">
                  <div className="rules-variant-card rules-variant-card--standard">
                    <strong className="rules-variant-title">{t('premiumLobby.rules8ReyesTitle')}</strong>
                    <p className="rules-variant-text">
                      {t('premiumLobby.rules8ReyesDesc')}
                    </p>
                  </div>
                  <div className="rules-variant-card rules-variant-card--classic">
                    <strong className="rules-variant-title">{t('premiumLobby.rules4ReyesTitle')}</strong>
                    <p className="rules-variant-text">
                      {t('premiumLobby.rules4ReyesDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- ONLINE TOURNAMENT DETAILS MODAL (WITH BRACKETS) ---------- */}
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
                {t('premiumLobby.tournamentOnline')}
              </span>
              <h2 className="tourney-details-title">
                {tourneyDetails.tournament.title || tourneyDetails.tournament.tournamentName}
              </h2>
            </div>

            {loadingTourneyDetails ? (
              <div className="tourney-details-loader-box">
                <div className="lobby-loader tourney-details-loader-spinner"></div>
                <p className="tourney-details-loader-text">{t('premiumLobby.loadingLeaderboard')}</p>
              </div>
            ) : (
              <>
                {/* DETAILS GRID */}
                <div className="tourney-metrics-grid">
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">{t('premiumLobby.registration')}</span>
                    <span className="tourney-metric-value tourney-metric-value--fee">💰 {tourneyDetails.tournament.coinsFee || 0} tx</span>
                  </div>
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">{t('premiumLobby.championReward')}</span>
                    <span className="tourney-metric-value tourney-metric-value--reward">🏆 {tourneyDetails.tournament.coinsReward || 0} tx</span>
                  </div>
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">{t('premiumLobby.capacity')}</span>
                    <span className="tourney-metric-value">{tourneyDetails.participants.length} / {tourneyDetails.tournament.maxTeams || 8}</span>
                  </div>
                  <div className="tourney-metric-card">
                    <span className="tourney-metric-label">{t('premiumLobby.status')}</span>
                    <span className={`tourney-metric-value--status ${tourneyDetails.tournament.status === 'finished'
                        ? 'tourney-metric-value--status-finished'
                        : tourneyDetails.tournament.status === 'playing'
                          ? 'tourney-metric-value--status-playing'
                          : 'tourney-metric-value--status-open'
                      }`}>
                      {tourneyDetails.tournament.status === 'open' ? t('premiumLobby.open') : tourneyDetails.tournament.status === 'playing' ? t('premiumLobby.inGame') : t('premiumLobby.finished')}
                    </span>
                  </div>
                </div>

                {/* ACTION TRIGGERS (JOIN / START) */}
                {tourneyDetails.tournament.status === 'open' && (
                  <div className="tourney-actions-row">
                    {tourneyDetails.participants.some((p: any) => p.userId === currentUserId) ? (
                      <button className="tourney-btn-inscribed" disabled>
                        {t('premiumLobby.alreadyRegistered')}
                      </button>
                    ) : (
                      <button className="btn-action tourney-btn-flex" onClick={handleJoinOnlineTournament}>
                        {t('premiumLobby.registerFor', { fee: tourneyDetails.tournament.coinsFee || 0 })}
                      </button>
                    )}

                    {tourneyDetails.tournament.organizerId === currentUserId && (
                      <button
                        className="btn-action tourney-btn-admin-start"
                        onClick={handleStartOnlineTournament}
                        disabled={tourneyDetails.participants.length < 2}
                      >
                        {t('premiumLobby.startTournamentAdmin')}
                      </button>
                    )}
                  </div>
                )}

                {/* REGISTERED PLAYERS (IF OPEN) */}
                {tourneyDetails.tournament.status === 'open' && (
                  <div className="tourney-participants-section">
                    <h3 className="tourney-section-heading">{t('premiumLobby.registeredParticipants')}</h3>
                    {tourneyDetails.participants.length === 0 ? (
                      <p className="tourney-participants-empty">{t('premiumLobby.noRegistrations')}</p>
                    ) : (
                      <div className="tourney-participants-list">
                        {tourneyDetails.participants.map((player: any) => (
                          <span key={player.userId} className={`tourney-participant-pill ${player.userId === currentUserId ? 'tourney-participant-pill--me' : ''}`}>
                            👤 {player.username} {player.userId === currentUserId && `(${t('premiumLobby.you')})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ---------- VISUAL BRACKET TREE ---------- */}
                {(tourneyDetails.tournament.status === 'playing' || tourneyDetails.tournament.status === 'finished') && (
                  <div>
                    <h3 className="tourney-bracket-heading">{t('premiumLobby.tournamentBracket')}</h3>

                    {activeMatch && (
                      <div className="active-match-card">
                        <h4 className="active-match-title">
                          ⚡ {t('premiumLobby.yourActiveMatch')}
                        </h4>
                        
                        <div className="active-match-players-row">
                          <div className="active-match-player">
                            <span className="player-name">
                              {getTourneyUsernameById(activeMatch.player1Id)}
                            </span>
                            <span className={`ready-badge ${activeMatch.player1Ready ? 'ready' : 'not-ready'}`}>
                              {activeMatch.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')}
                            </span>
                          </div>
                          
                          <div className="active-match-vs">VS</div>
                          
                          <div className="active-match-player">
                            <span className="player-name">
                              {getTourneyUsernameById(activeMatch.player2Id)}
                            </span>
                            <span className={`ready-badge ${activeMatch.player2Ready ? 'ready' : 'not-ready'}`}>
                              {activeMatch.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')}
                            </span>
                          </div>
                        </div>

                        {secondsLeft !== null && (
                          <div className="active-match-timer-box">
                            <div className="timer-countdown">
                              ⏱️ {formatTime(secondsLeft)}
                            </div>
                            <p className="timer-warning">
                              ⚠️ {t('premiumLobby.disqualificationWarning')}
                            </p>
                          </div>
                        )}

                        <div className="active-match-actions">
                          {activeMatch.gameRoomId ? (
                            <div className="redirecting-msg">
                              🔄 {t('premiumLobby.bothReadyRedirecting')}
                            </div>
                          ) : (
                            <>
                              {currentUserId === activeMatch.player1Id && (
                                activeMatch.player1Ready ? (
                                  <button onClick={() => handleCancelReady(activeMatch.matchId)} className="btn-action cancel-ready-btn" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {t('premiumLobby.cancelReadyBtn')}
                                  </button>
                                ) : (
                                  <button onClick={() => handleReadyUp(activeMatch.matchId)} className="btn-action ready-btn" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {t('premiumLobby.readyBtn')}
                                  </button>
                                )
                              )}
                              
                              {currentUserId === activeMatch.player2Id && (
                                activeMatch.player2Ready ? (
                                  <button onClick={() => handleCancelReady(activeMatch.matchId)} className="btn-action cancel-ready-btn" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {t('premiumLobby.cancelReadyBtn')}
                                  </button>
                                ) : (
                                  <button onClick={() => handleReadyUp(activeMatch.matchId)} className="btn-action ready-btn" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {t('premiumLobby.readyBtn')}
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="tourney-bracket-tree">

                      {/* ROUND 1: QUARTERFINALS */}
                      {tourneyDetails.matches.some((m: any) => m.roundNumber === 1) && (
                        <div className="bracket-round-column">
                          <span className="bracket-round-label">{t('premiumLobby.quarterfinals')}</span>
                          {tourneyDetails.matches.filter((m: any) => m.roundNumber === 1).map((match: any) => {
                            const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                            const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                            const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                            const isActive = !match.winnerId && match.player1Id && match.player2Id;

                            return (
                              <div key={match.matchId} className={`bracket-match-box ${reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                                <div className={`bracket-player-row ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                                  <span>
                                    {getTourneyUsernameById(match.player1Id)}
                                    {match.player1Id && !match.winnerId && (
                                      <span className={`ready-indicator-dot ${match.player1Ready ? 'ready' : 'not-ready'}`} title={match.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                    )}
                                  </span>
                                  {isWinner1 && <span>✔</span>}
                                </div>
                                <div className="bracket-divider" />
                                <div className={`bracket-player-row ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                                  <span>
                                    {getTourneyUsernameById(match.player2Id)}
                                    {match.player2Id && !match.winnerId && (
                                      <span className={`ready-indicator-dot ${match.player2Ready ? 'ready' : 'not-ready'}`} title={match.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                    )}
                                  </span>
                                  {isWinner2 && <span>✔</span>}
                                </div>
                                {match.score && (
                                  <div className="bracket-score">{t('premiumLobby.result')} {match.score}</div>
                                )}
                                {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                  <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} className="bracket-report-icon-btn" title={t("premiumLobby.reportWinnerTooltip")}>
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
                        <span className="bracket-round-label">{t('premiumLobby.semifinals')}</span>
                        {tourneyDetails.matches.filter((m: any) => m.roundNumber === 2).map((match: any) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;

                          return (
                            <div key={match.matchId} className={`bracket-match-box ${reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                              <div className={`bracket-player-row ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                                <span>
                                  {getTourneyUsernameById(match.player1Id)}
                                  {match.player1Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player1Ready ? 'ready' : 'not-ready'}`} title={match.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {isWinner1 && <span>✔</span>}
                              </div>
                              <div className="bracket-divider" />
                              <div className={`bracket-player-row ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                                <span>
                                  {getTourneyUsernameById(match.player2Id)}
                                  {match.player2Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player2Ready ? 'ready' : 'not-ready'}`} title={match.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {isWinner2 && <span>✔</span>}
                              </div>
                              {match.score && (
                                <div className="bracket-score">{t('premiumLobby.result')} {match.score}</div>
                              )}
                              {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} className="bracket-report-icon-btn" title={t("premiumLobby.reportWinnerTooltip")}>
                                  ✎
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ROUND 3: GRAND FINAL */}
                      <div className="bracket-round-column bracket-round-column--final">
                        <span className="bracket-round-label">{t('premiumLobby.grandFinal')}</span>
                        {tourneyDetails.matches.filter((m: any) => m.roundNumber === 3).map((match: any) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;
                          const championId = match.winnerId;

                          return (
                            <div key={match.matchId} className={`bracket-match-box bracket-match-box--final ${championId ? 'bracket-match-box--championship' : reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                              {championId && <span className="bracket-match-champion-tag">{t('premiumLobby.champion')}</span>}
                              <div className={`bracket-player-row bracket-player-row--final ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                                <span>
                                  {getTourneyUsernameById(match.player1Id)}
                                  {match.player1Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player1Ready ? 'ready' : 'not-ready'}`} title={match.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {isWinner1 && <span>🏆</span>}
                              </div>
                              <div className="bracket-divider bracket-divider--final" />
                              <div className={`bracket-player-row bracket-player-row--final ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                                <span>
                                  {getTourneyUsernameById(match.player2Id)}
                                  {match.player2Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player2Ready ? 'ready' : 'not-ready'}`} title={match.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {isWinner2 && <span>🏆</span>}
                              </div>
                              {match.score && (
                                <div className="bracket-score bracket-score--final">{t('premiumLobby.result')} {match.score}</div>
                              )}
                              {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} className="bracket-report-icon-btn" title={t("premiumLobby.reportWinnerTooltip")}>
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
                        <h4 className="bracket-report-form-title">{t('premiumLobby.reportResult')}</h4>

                        <div className="bracket-report-row">
                          <div className="bracket-report-field-group">
                            <label className="bracket-report-label">{t('premiumLobby.selectWinner')}</label>
                            <select
                              value={reportWinnerId || ''}
                              onChange={(e) => setReportWinnerId(Number(e.target.value))}
                              className="bracket-report-select"
                            >
                              <option value="">{t('premiumLobby.selectOption')}</option>
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
                            <label className="bracket-report-label">{t('premiumLobby.score')}</label>
                            <input
                              type="text"
                              value={reportScore}
                              onChange={(e) => setReportScore(e.target.value)}
                              placeholder={t("premiumLobby.scorePlaceholder")}
                              className="bracket-report-input"
                            />
                          </div>

                          <div className="bracket-report-actions">
                            <button type="submit" className="btn-action bracket-report-btn-save" disabled={!reportWinnerId}>
                              {t('premiumLobby.save')}
                            </button>
                            <button type="button" onClick={() => setReportingMatchId(null)} className="bracket-report-btn-cancel">
                              {t('premiumLobby.cancel')}
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
