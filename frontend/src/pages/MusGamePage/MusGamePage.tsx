import React, { useState, useEffect, useRef } from 'react';
import GameScoreBoard from './components/GameScoreBoard';
import GameConsoleLogs from './components/GameConsoleLogs';
import ActionPanel from './components/ActionPanel';
import PlayerHand from './components/PlayerHand';
import PremiumLobby from './components/PremiumLobby';
import LobbyWaitingRoom from './components/LobbyWaitingRoom';
import { useMusGame } from './hooks/useMusGame';
import api from '../../services/api';
import './styles/mus-game.css';
import { useSeo } from '../../hooks/useSeo';

const getSignEmojiOnly = (signKey: string): string => {
  const mapping: { [key: string]: string } = {
    dos_reyes: '🤨',
    dos_ases: '😉',
    medias: '👅',
    duples: '🤐',
    '31': '😜',
    '30': '😔'
  };
  return mapping[signKey] || signKey;
};

const playSound = (type: 'card' | 'click' | 'timer' | 'win', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'card') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'timer') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }
  } catch (err) {
    console.warn('AudioContext failed:', err);
  }
};

const TimerCircle: React.FC<{ timeLeft: number; isActive: boolean }> = ({ timeLeft, isActive }) => {
  if (!isActive) return null;
  const maxTime = 10;
  const radius = 27;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(timeLeft, maxTime) / maxTime) * circumference;

  let strokeColor = '#10b981'; // Green
  if (timeLeft <= 3) {
    strokeColor = '#ef4444'; // Red
  } else if (timeLeft <= 6) {
    strokeColor = '#f59e0b'; // Amber
  }

  return (
    <svg className="timer-svg" width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', top: '-6px', left: '-6px', pointerEvents: 'none', zIndex: 10 }}>
      <circle
        cx="32"
        cy="32"
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
};

const MiniDeckToken: React.FC<{ size?: number; className?: string }> = ({ size = 28, className }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}>
      <rect x="5" y="7" width="14" height="11" rx="1.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
      <rect x="4.5" y="6" width="14" height="11" rx="1.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x="4" y="5" width="14" height="11" rx="1.5" fill="#c2410c" stroke="#ffffff" strokeWidth="1" />
      <line x1="4.5" y1="5.5" x2="17.5" y2="15.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <line x1="4.5" y1="15.5" x2="17.5" y2="5.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <circle cx="11" cy="10.5" r="2.5" stroke="#ffedd5" strokeWidth="0.6" fill="none" opacity="0.5" />
    </svg>
  );
};

const MusGamePage: React.FC = () => {
  useSeo({
    title: 'Jugar Mus Online - Partidas y Matchmaking | Enbido',
    description: 'Entra a jugar al Mus de forma gratuita en Enbido. Emparejamiento por ELO, salas privadas y juego contra bots avanzados.',
    keywords: 'jugar mus, mus online, emparejamiento mus, salas de mus, jugar mus online gratis',
    canonical: 'https://enbido.eus/jugar',
    ogImage: 'https://enbido.eus/hero-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      'name': 'Lobby de Mus - Enbido',
      'url': 'https://enbido.eus/jugar',
      'image': 'https://enbido.eus/hero-mus.png',
      'description': 'Entra a jugar al Mus de forma gratuita en Enbido. Emparejamiento por ELO, salas privadas y juego contra bots avanzados.',
      'gamePlatform': 'Web Browser',
      'numberOfPlayers': {
        '@type': 'QuantitativeValue',
        'value': 4
      }
    }
  });

  // Extraemos el ID del usuario del localStorage, o usamos el 1 por defecto
  const currentUserId = Number(localStorage.getItem('userId') || '1');

  // Cargar perfil para obtener equipamiento dinámico
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile for game felt:', err);
      }
    };
    fetchProfile();
  }, []);

  const {
    isPlaying, phase, stage, score, logs, chatMessages, selectedCards, speechBubbles, playerHand, botHands,
    roomId, seats, isSearching, queueSize, username, isMyTurn, betState,
    handleStartMatch, startNewHand, handleUserMusDecision, handleExecuteDiscards, handleBetAction, toggleCardSelection,
    onAddBot, onJoinRoom, onCreateRoom, onStartMatchmaking, onCancelMatchmaking, onLeaveRoom,
    reyesOption, maxRounds, updateRoomConfig, sendChatMessage, sendSign,
    activeSigns, turnDeadline, activeTurnIdx, dealerIdx
  } = useMusGame(currentUserId);

  const [activeTab, setActiveTab] = useState<'logs' | 'chat'>('logs');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('gameMuted') === 'true');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSeñasOpen, setIsSeñasOpen] = useState(false);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('gameMuted', String(next));
      return next;
    });
  };

  const prevRoundsUs = useRef(score.roundsUs);
  const prevRoundsThem = useRef(score.roundsThem);
  const prevIsMyTurn = useRef(isMyTurn);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (!isPlaying) return;
    if (isMyTurn && !prevIsMyTurn.current) {
      playSound('click', isMuted);
    }
    if (phase !== prevPhase.current) {
      playSound('card', isMuted);
    }
    prevIsMyTurn.current = isMyTurn;
    prevPhase.current = phase;
  }, [isMyTurn, phase, isPlaying, isMuted]);

  useEffect(() => {
    if (!isPlaying) return;
    if (score.roundsUs !== prevRoundsUs.current || score.roundsThem !== prevRoundsThem.current) {
      playSound('win', isMuted);
    }
    prevRoundsUs.current = score.roundsUs;
    prevRoundsThem.current = score.roundsThem;
  }, [score.roundsUs, score.roundsThem, isPlaying, isMuted]);

  useEffect(() => {
    if (turnDeadline === 0) {
      setTimeLeft(0);
      return;
    }
    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((turnDeadline - now) / 1000));
      setTimeLeft(diff);
      if (isMyTurn && diff > 0 && diff <= 3) {
        playSound('timer', isMuted);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [turnDeadline, isMyTurn, isMuted]);

  // Estados para el Drawer y Diseño Responsivo en Móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatMessages.length > lastMessageCount) {
      if (!isSidebarOpen || activeTab !== 'chat') {
        setHasNewNotifications(true);
      }
      setLastMessageCount(chatMessages.length);
    }
  }, [chatMessages, isSidebarOpen, activeTab, lastMessageCount]);

  useEffect(() => {
    if (isSidebarOpen) {
      setHasNewNotifications(false);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleActionPanelStart = () => {
    if (phase === 'round-over') {
      startNewHand();
    } else {
      handleStartMatch();
    }
  };

  const executeDiscardsLocal = () => {
    handleExecuteDiscards(selectedCards);
  };

  const handleBetLocal = (action: 'Paso' | 'Envido' | 'Ordago' | 'Quiero' | 'No Quiero') => {
    handleBetAction(action);
  };

  // --- VISTA 1: LOBBY DE SELECCIÓN DE SALAS / APUESTAS ---
  if (roomId === '') {
    return (
      <>
        <PremiumLobby
          username={username}
          isSearching={isSearching}
          queueSize={queueSize}
          onJoinRoom={onJoinRoom}
          onCreateRoom={onCreateRoom}
          onStartMatchmaking={onStartMatchmaking}
          onCancelMatchmaking={onCancelMatchmaking}
        />
      </>
    );
  }

  // --- VISTA 2: SALA DE ESPERA / PRE-SEATS MESA ---
  if (!isPlaying) {
    return (
      <>
        <LobbyWaitingRoom
          roomId={roomId}
          seats={seats}
          currentUserId={currentUserId}
          onAddBot={onAddBot}
          onStartGame={handleStartMatch}
          onLeaveRoom={onLeaveRoom}
          reyesOption={reyesOption}
          maxRounds={maxRounds}
          onUpdateConfig={updateRoomConfig}
        />
      </>
    );
  }

  // --- VISTA 3: EL TAPETE VERDE DE JUEGO MULTIJUGADOR ---
  return (
    <>
      <div className="mus-view-container">

        {/* OVERLAY DEL DRAWER EN MÓVIL */}
        {isMobile && (
          <div
            className={`drawer-overlay ${isSidebarOpen ? 'is-open' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* PANEL IZQUIERDO: LA MESA VERDE */}
        <div className="felt-layout-pane">

          {/* MARCADOR FLOTANTE PARA MÓVIL */}
          {isMobile && (
            <div className="mobile-score-container" onClick={() => setIsSidebarOpen(true)}>
              <div className="mobile-score-row">
                <span className="mobile-score-tag">TÚ: {score.roundsUs || 0} ({score.us})</span>
                <span className="mobile-score-vs">VS</span>
                <span className="mobile-score-tag">RIVAL: {score.roundsThem || 0} ({score.them})</span>
              </div>
            </div>
          )}

          {/* BOTÓN FLOTANTE PARA ABRIR EL DRAWER */}
          {isMobile && (
            <button
              className="mobile-drawer-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
            >

              Chat y Logs
              {hasNewNotifications && <span className="notification-dot"></span>}
            </button>
          )}

          <div className="game-felt-board">

            <div className="felt-center-emblem">
              <h1 className="felt-logo">ENBIDO</h1>
              <span className="felt-sub">Mesa de Mus</span>
              {!isMobile && (
                <button
                  className="leave-felt-btn"
                  onClick={onLeaveRoom}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.85)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'background-color 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.85)')}
                >
                  🚪 Abandonar Mesa
                </button>
              )}
            </div>

            {/* JUGADOR NORTE (Mapeado dinámicamente) */}
            <div className={`player-position position-north ${activeTurnIdx === 2 ? 'active-zone' : ''}`}>
              <div className="player-avatar-card">
                <div className="player-avatar-wrapper" style={{ position: 'relative', width: '52px', height: '52px' }}>
                  <TimerCircle timeLeft={timeLeft} isActive={activeTurnIdx === 2} />
                  <div className={`player-avatar-circle partner-theme ${activeSigns[2] ? 'has-active-sign' : ''}`}>
                    {(seats[2]?.username || 'Bot Norte').slice(0, 2).toUpperCase()}
                  </div>
                  {activeTurnIdx === 2 && timeLeft > 0 && (
                    <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
                      {timeLeft}s
                    </div>
                  )}
                </div>
                <div className="player-avatar-details">
                  <span className="player-name-label">{seats[2]?.username || 'Bot Norte'}</span>
                </div>
              </div>
              <div className="player-hand-wrapper">
                <div className="player-cards-slot-bg">
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                </div>
                <PlayerHand hand={isPlaying ? botHands[0] : []} isBot={phase !== 'round-over'} equippedDeckItemId={profile?.equippedDeckItemId} />
              </div>
              {dealerIdx === 2 && (
                <div className="dealer-baraja-token" title="Dador (Tiene la baraja)">
                  <MiniDeckToken />
                </div>
              )}
              {speechBubbles[2] && <div className="speech-bubble show">{speechBubbles[2]}</div>}
              {activeSigns[2] && (
                <div className="mus-sign-badge pop-in">
                  <div className="mus-sign-badge-glow"></div>
                  <span className="mus-sign-badge-text">
                    {getSignEmojiOnly(activeSigns[2])}
                  </span>
                </div>
              )}
            </div>

            {/* JUGADOR OESTE (Silla relative 3 - Rival 2) */}
            <div className={`player-position position-west ${activeTurnIdx === 3 ? 'active-zone' : ''}`}>
              <div className="player-avatar-card">
                <div className="player-avatar-wrapper" style={{ position: 'relative', width: '52px', height: '52px' }}>
                  <TimerCircle timeLeft={timeLeft} isActive={activeTurnIdx === 3} />
                  <div className={`player-avatar-circle rival-theme ${activeSigns[3] ? 'has-active-sign' : ''}`}>
                    {(seats[3]?.username || 'Bot Oeste').slice(0, 2).toUpperCase()}
                  </div>
                  {activeTurnIdx === 3 && timeLeft > 0 && (
                    <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
                      {timeLeft}s
                    </div>
                  )}
                </div>
                <div className="player-avatar-details">
                  <span className="player-name-label">{seats[3]?.username || 'Bot Oeste'}</span>
                </div>
              </div>
              <div className="player-hand-wrapper">
                <div className="player-cards-slot-bg">
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                </div>
                <PlayerHand hand={isPlaying ? botHands[2] : []} isBot={phase !== 'round-over'} equippedDeckItemId={profile?.equippedDeckItemId} />
              </div>
              {dealerIdx === 3 && (
                <div className="dealer-baraja-token" title="Dador (Tiene la baraja)">
                  <MiniDeckToken />
                </div>
              )}
              {speechBubbles[3] && <div className="speech-bubble show">{speechBubbles[3]}</div>}
              {activeSigns[3] && (
                <div className="mus-sign-badge pop-in">
                  <div className="mus-sign-badge-glow"></div>
                  <span className="mus-sign-badge-text">
                    {getSignEmojiOnly(activeSigns[3])}
                  </span>
                </div>
              )}
            </div>

            {/* JUGADOR ESTE (Silla relative 1 - Rival 1) */}
            <div className={`player-position position-east ${activeTurnIdx === 1 ? 'active-zone' : ''}`}>
              <div className="player-avatar-card">
                <div className="player-avatar-wrapper" style={{ position: 'relative', width: '52px', height: '52px' }}>
                  <TimerCircle timeLeft={timeLeft} isActive={activeTurnIdx === 1} />
                  <div className={`player-avatar-circle rival-theme ${activeSigns[1] ? 'has-active-sign' : ''}`}>
                    {(seats[1]?.username || 'Bot Este').slice(0, 2).toUpperCase()}
                  </div>
                  {activeTurnIdx === 1 && timeLeft > 0 && (
                    <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
                      {timeLeft}s
                    </div>
                  )}
                </div>
                <div className="player-avatar-details">
                  <span className="player-name-label">{seats[1]?.username || 'Bot Este'}</span>
                </div>
              </div>
              <div className="player-hand-wrapper">
                <div className="player-cards-slot-bg">
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                </div>
                <PlayerHand hand={isPlaying ? botHands[1] : []} isBot={phase !== 'round-over'} equippedDeckItemId={profile?.equippedDeckItemId} />
              </div>
              {dealerIdx === 1 && (
                <div className="dealer-baraja-token" title="Dador (Tiene la baraja)">
                  <MiniDeckToken />
                </div>
              )}
              {speechBubbles[1] && <div className="speech-bubble show">{speechBubbles[1]}</div>}
              {activeSigns[1] && (
                <div className="mus-sign-badge pop-in">
                  <div className="mus-sign-badge-glow"></div>
                  <span className="mus-sign-badge-text">
                    {getSignEmojiOnly(activeSigns[1])}
                  </span>
                </div>
              )}
            </div>

            {/* TÚ (JUGADOR SUR - Silla relative 0) */}
            <div className={`player-position position-south ${activeTurnIdx === 0 ? 'active-zone' : ''}`}>
              <div className="player-avatar-card">
                <div className="player-avatar-wrapper" style={{ position: 'relative', width: '52px', height: '52px' }}>
                  <TimerCircle timeLeft={timeLeft} isActive={activeTurnIdx === 0} />
                  <div className={`player-avatar-circle player-theme ${activeSigns[0] ? 'has-active-sign' : ''} ${profile?.equippedAvatarItemId === 1 ? 'avatar-premium-gold' : profile?.equippedAvatarItemId === 2 ? 'avatar-premium-green' : ''}`}>
                    {(seats[0]?.username || 'Tú').slice(0, 2).toUpperCase()}
                  </div>
                  {activeTurnIdx === 0 && timeLeft > 0 && (
                    <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
                      {timeLeft}s
                    </div>
                  )}
                </div>
                <div className="player-avatar-details">
                  <span className="player-name-label">{seats[0]?.username || 'Tú'} (Tú)</span>
                  {profile?.equippedTitleItemId === 5 && <span className="player-title-badge player-title-badge--green">HANDIA</span>}
                  {profile?.equippedTitleItemId === 6 && <span className="player-title-badge player-title-badge--gold">ENBIDO MAISU</span>}
                </div>
              </div>
              
              <div className="player-hand-wrapper">
                <div className="player-cards-slot-bg">
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                  <div className="slot-outline-card"></div>
                </div>
                <PlayerHand
                  hand={isPlaying ? playerHand : []}
                  isBot={false}
                  isSelectable={phase === 'discarding'}
                  selectedCards={selectedCards}
                  onCardClick={toggleCardSelection}
                  equippedDeckItemId={profile?.equippedDeckItemId}
                />
              </div>
              {dealerIdx === 0 && (
                <div className="dealer-baraja-token" title="Dador (Tiene la baraja)">
                  <MiniDeckToken />
                </div>
              )}
              {speechBubbles[0] && <div className="speech-bubble show">{speechBubbles[0]}</div>}
              {activeSigns[0] && (
                <div className="mus-sign-badge pop-in">
                  <div className="mus-sign-badge-glow"></div>
                  <span className="mus-sign-badge-text">
                    {getSignEmojiOnly(activeSigns[0])}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* SEÑAS PANEL DROPDOWN (Completamente fuera de la mesa para no tapar nada) */}
          {isPlaying && (
            <div className="señas-dropdown-container">
              <button
                type="button"
                className="btn-señas-toggle"
                onClick={() => setIsSeñasOpen(!isSeñasOpen)}
                title="Abrir menú de señas"
              >
                🤫 Señas
              </button>
              {isSeñasOpen && (
                <div className="señas-popup-menu">
                  <span className="señas-menu-title">Haz una seña:</span>
                  <button type="button" className="btn-señas-menu-item" onClick={() => { sendSign('dos_reyes'); setIsSeñasOpen(false); }}>
                    🤨 Reyes (Cejas)
                  </button>
                  <button type="button" className="btn-señas-menu-item" onClick={() => { sendSign('dos_ases'); setIsSeñasOpen(false); }}>
                    😉 Ases (Guiño)
                  </button>
                  <button type="button" className="btn-señas-menu-item" onClick={() => { sendSign('medias'); setIsSeñasOpen(false); }}>
                    👅 Medias (Lengua)
                  </button>
                  <button type="button" className="btn-señas-menu-item" onClick={() => { sendSign('duples'); setIsSeñasOpen(false); }}>
                    🤐 Duples (Morder)
                  </button>
                  <button type="button" className="btn-señas-menu-item" onClick={() => { sendSign('31'); setIsSeñasOpen(false); }}>
                    😜 31 (Guiño+Lengua)
                  </button>
                  <button type="button" className="btn-señas-menu-item" onClick={() => { sendSign('30'); setIsSeñasOpen(false); }}>
                    😔 30 (Ojos)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PANEL DE ACCIONES CONTEXTUAL PARA MÓVIL */}
          {isMobile && (
            <div className="mobile-action-panel-container">
              <ActionPanel
                phase={phase}
                stage={stage}
                selectedCount={selectedCards.length}
                isMyTurn={isMyTurn}
                betState={betState}
                onStart={handleActionPanelStart}
                onDecision={handleUserMusDecision}
                onDiscard={executeDiscardsLocal}
                onBet={handleBetLocal}
              />
            </div>
          )}

        </div>

        {/* PANEL DERECHO / DRAWER FLOTANTE: CONTROLES Y MARCADOR */}
        <aside className={`sidebar-panel ${isMobile ? 'mobile-drawer' : ''} ${isSidebarOpen ? 'is-open' : ''}`}>

          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
              <button className="drawer-close-btn" onClick={() => setIsSidebarOpen(false)}>
                ✕ Cerrar Panel
              </button>
              <button
                className="leave-felt-btn"
                onClick={onLeaveRoom}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(220, 38, 38, 0.85)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  height: 'fit-content',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                }}
              >
                🚪 Abandonar
              </button>
            </div>
          )}

          <GameScoreBoard score={score} maxRounds={maxRounds} />

          <div className="sound-toggle-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Sonidos de Juego</span>
            <button
              onClick={toggleMute}
              style={{
                background: isMuted ? '#ef4444' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isMuted ? '🔇 Silenciado' : '🔊 Activado'}
            </button>
          </div>

          <div className="game-logs-widget">
            <div className="logs-header-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '10px' }}>
              <button
                onClick={() => setActiveTab('logs')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: activeTab === 'logs' ? 'rgba(255, 255, 255, 0.05)' : 'none',
                  border: 'none',
                  color: activeTab === 'logs' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderBottom: activeTab === 'logs' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                📋 Historial
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: activeTab === 'chat' ? 'rgba(255, 255, 255, 0.05)' : 'none',
                  border: 'none',
                  color: activeTab === 'chat' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderBottom: activeTab === 'chat' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                💬 Chat Mesa
              </button>
            </div>

            {activeTab === 'logs' ? (
              <GameConsoleLogs logs={logs} />
            ) : (
              <div className="game-chat-tab-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
                <div
                  className="game-chat-messages-box"
                  ref={chatEndRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.75rem',
                    background: '#000',
                    borderRadius: '8px',
                    border: '1px solid #222',
                    minHeight: '200px'
                  }}
                >
                  {chatMessages.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '30px', fontStyle: 'italic' }}>
                      No hay mensajes aún. ¡Di hola!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const parts = msg.split(': ');
                      const sender = parts[0];
                      const content = parts.slice(1).join(': ');
                      const isMe = sender === username;

                      return (
                        <div key={idx} style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: isMe ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          border: isMe ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          color: '#fff',
                          wordBreak: 'break-word',
                          animation: 'slideUp 0.2s ease-out'
                        }}>
                          <strong style={{ color: isMe ? '#60a5fa' : '#fbbf24', display: 'block', fontSize: '0.65rem', marginBottom: '2px' }}>
                            {sender}
                          </strong>
                          <span style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>{content}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendChat}
                  style={{
                    display: 'flex',
                    paddingTop: '8px',
                    gap: '6px'
                  }}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe en la mesa..."
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Enviar
                  </button>
                </form>
              </div>
            )}
          </div>

          {!isMobile && (
            <ActionPanel
              phase={phase}
              stage={stage}
              selectedCount={selectedCards.length}
              isMyTurn={isMyTurn}
              betState={betState}
              onStart={handleActionPanelStart}
              onDecision={handleUserMusDecision}
              onDiscard={executeDiscardsLocal}
              onBet={handleBetLocal}
            />
          )}
        </aside>

      </div>
    </>
  );
};

export default MusGamePage;