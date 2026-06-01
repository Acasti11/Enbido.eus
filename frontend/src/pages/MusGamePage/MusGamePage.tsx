import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

const setupOscillator = (audioCtx: AudioContext, type: OscillatorType, freq: number) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  return { osc, gain };
};

const playClickSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'sine', 600);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
};

const playCardSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'triangle', 180);
  osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
};

const playTimerSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'sine', 750);
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
};

const playWinSound = (audioCtx: AudioContext) => {
  const { osc, gain } = setupOscillator(audioCtx, 'sine', 523.25);
  osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
  osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
  osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
};

const playSound = (type: 'card' | 'click' | 'timer' | 'win', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    if (type === 'click') playClickSound(audioCtx);
    else if (type === 'card') playCardSound(audioCtx);
    else if (type === 'timer') playTimerSound(audioCtx);
    else if (type === 'win') playWinSound(audioCtx);
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

  let strokeColor = '#10b981';
  if (timeLeft <= 3) strokeColor = '#ef4444';
  else if (timeLeft <= 6) strokeColor = '#f59e0b';

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

const PlayerPosition: React.FC<{
  position: 'north' | 'west' | 'east' | 'south';
  index: number;
  timeLeft: number;
  activeTurnIdx: number;
  seats: any[];
  botHands: any[][];
  isPlaying: boolean;
  phase: string;
  dealerIdx: number;
  speechBubbles: { [key: number]: string | null };
  activeSigns: { [key: number]: string | null };
  profile: any;
  playerHand?: any[];
  selectedCards?: string[];
  toggleCardSelection?: (cardId: string) => void;
  getSignEmojiOnly: (key: string) => string;
  t: (key: string) => string;
}> = ({
  position, index, timeLeft, activeTurnIdx, seats, botHands, isPlaying,
  phase, dealerIdx, speechBubbles, activeSigns, profile, playerHand,
  selectedCards, toggleCardSelection, getSignEmojiOnly, t
}) => {
  const isBot = position !== 'south';
  const hand = isBot ? botHands[position === 'north' ? 0 : position === 'west' ? 2 : 1] : playerHand || [];

  const getBotName = (): string => {
    if (position === 'north') return t('musGame.botNorth');
    if (position === 'west') return t('musGame.botWest');
    return t('musGame.botEast');
  };

  const username = seats[index]?.username || getBotName();
  const isSelf = position === 'south';
  const displayName = isSelf ? `${username} (${t('musGame.you')})` : username;
  const avatarClass = isSelf
    ? `player-theme ${activeSigns[index] ? 'has-active-sign' : ''} ${profile?.equippedAvatarItemId === 1 ? 'avatar-premium-gold' : profile?.equippedAvatarItemId === 2 ? 'avatar-premium-green' : ''}`
    : position === 'north'
    ? `partner-theme ${activeSigns[index] ? 'has-active-sign' : ''}`
    : `rival-theme ${activeSigns[index] ? 'has-active-sign' : ''}`;

  return (
    <div className={`player-position position-${position} ${activeTurnIdx === index ? 'active-zone' : ''}`}>
      <div className="player-avatar-card">
        <div className="player-avatar-wrapper" style={{ position: 'relative', width: '52px', height: '52px' }}>
          <TimerCircle timeLeft={timeLeft} isActive={activeTurnIdx === index} />
          <div className={`player-avatar-circle ${avatarClass}`}>
            {username.slice(0, 2).toUpperCase()}
          </div>
          {activeTurnIdx === index && timeLeft > 0 && (
            <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
              {timeLeft}s
            </div>
          )}
        </div>
        <div className="player-avatar-details">
          <span className="player-name-label">{displayName}</span>
          {isSelf && profile?.equippedTitleItemId === 5 && <span className="player-title-badge player-title-badge--green">HANDIA</span>}
          {isSelf && profile?.equippedTitleItemId === 6 && <span className="player-title-badge player-title-badge--gold">ENBIDO MAISU</span>}
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
          hand={isPlaying ? hand : []}
          isBot={isBot && phase !== 'round-over'}
          isSelectable={isSelf && phase === 'discarding'}
          selectedCards={selectedCards}
          onCardClick={toggleCardSelection}
          equippedDeckItemId={profile?.equippedDeckItemId}
        />
      </div>
      {dealerIdx === index && (
        <div className="dealer-baraja-token" title={t('musGame.dealerTooltip')}>
          <MiniDeckToken />
        </div>
      )}
      {speechBubbles[index] && <div className="speech-bubble show">{speechBubbles[index]}</div>}
      {activeSigns[index] && (
        <div className="mus-sign-badge pop-in">
          <div className="mus-sign-badge-glow"></div>
          <span className="mus-sign-badge-text">
            {getSignEmojiOnly(activeSigns[index])}
          </span>
        </div>
      )}
    </div>
  );
};

const MusGamePage: React.FC = () => {
  const { t } = useTranslation();

  useSeo({
    title: t('seo.gameTitle'),
    description: t('seo.gameDescription'),
    keywords: t('seo.gameKeywords'),
    canonical: 'https://enbido.eus/jugar',
    ogImage: 'https://enbido.eus/home-image-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      'name': t('seo.gameOgTitle'),
      'url': 'https://enbido.eus/jugar',
      'image': 'https://enbido.eus/home-image-mus.png',
      'description': t('seo.gameDescription'),
      'gamePlatform': t('seo.gamePlatform'),
      'numberOfPlayers': {
        '@type': 'QuantitativeValue',
        'value': 4
      }
    }
  });

  const currentUserId = Number(localStorage.getItem('userId') || '1');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        setProfile(res.data);
      } catch (err) {
        console.error(t('musGame.errorProfile'), err);
      }
    };
    fetchProfile();
  }, [t]);

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
  const [isSignsOpen, setIsSignsOpen] = useState(false);

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
    if (isMyTurn && !prevIsMyTurn.current) playSound('click', isMuted);
    if (phase !== prevPhase.current) playSound('card', isMuted);
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
      if (isMyTurn && diff > 0 && diff <= 3) playSound('timer', isMuted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [turnDeadline, isMyTurn, isMuted]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatMessages.length > lastMessageCount) {
      if (!isSidebarOpen || activeTab !== 'chat') setHasNewNotifications(true);
      setLastMessageCount(chatMessages.length);
    }
  }, [chatMessages, isSidebarOpen, activeTab, lastMessageCount]);

  useEffect(() => {
    if (isSidebarOpen) setHasNewNotifications(false);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
  }, [chatMessages, activeTab]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleActionPanelStart = () => {
    if (phase === 'round-over') startNewHand();
    else handleStartMatch();
  };

  const executeDiscardsLocal = () => handleExecuteDiscards(selectedCards);

  const handleBetLocal = (action: 'Paso' | 'Envido' | 'Ordago' | 'Quiero' | 'No Quiero') => {
    handleBetAction(action);
  };

  if (roomId === '') {
    return (
      <PremiumLobby
        username={username}
        isSearching={isSearching}
        queueSize={queueSize}
        onJoinRoom={onJoinRoom}
        onCreateRoom={onCreateRoom}
        onStartMatchmaking={onStartMatchmaking}
        onCancelMatchmaking={onCancelMatchmaking}
      />
    );
  }

  if (!isPlaying) {
    return (
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
    );
  }

  return (
    <>
      <div className="mus-view-container">

        {isMobile && (
          <div
            className={`drawer-overlay ${isSidebarOpen ? 'is-open' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="felt-layout-pane">

          {isMobile && (
            <div className="mobile-score-container" onClick={() => setIsSidebarOpen(true)}>
              <div className="mobile-score-row">
                <span className="mobile-score-tag">{t('musGame.scoreUs')}: {score.roundsUs || 0} ({score.us})</span>
                <span className="mobile-score-vs">VS</span>
                <span className="mobile-score-tag">{t('musGame.scoreThem')}: {score.roundsThem || 0} ({score.them})</span>
              </div>
            </div>
          )}

          {isMobile && (
            <button
              className="mobile-drawer-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
            >
              {t('musGame.chatLogs')}
              {hasNewNotifications && <span className="notification-dot"></span>}
            </button>
          )}

          <div className="game-felt-board">

            <div className="felt-center-emblem">
              <h1 className="felt-logo">ENBIDO</h1>
              <span className="felt-sub">{t('musGame.musTable')}</span>
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
                  {t('musGame.leaveTableShort')}
                </button>
              )}
            </div>

            <PlayerPosition position="north" index={2} timeLeft={timeLeft} activeTurnIdx={activeTurnIdx}
              seats={seats} botHands={botHands} isPlaying={isPlaying} phase={phase} dealerIdx={dealerIdx}
              speechBubbles={speechBubbles} activeSigns={activeSigns} profile={profile}
              getSignEmojiOnly={getSignEmojiOnly} t={t} />

            <PlayerPosition position="west" index={3} timeLeft={timeLeft} activeTurnIdx={activeTurnIdx}
              seats={seats} botHands={botHands} isPlaying={isPlaying} phase={phase} dealerIdx={dealerIdx}
              speechBubbles={speechBubbles} activeSigns={activeSigns} profile={profile}
              getSignEmojiOnly={getSignEmojiOnly} t={t} />

            <PlayerPosition position="east" index={1} timeLeft={timeLeft} activeTurnIdx={activeTurnIdx}
              seats={seats} botHands={botHands} isPlaying={isPlaying} phase={phase} dealerIdx={dealerIdx}
              speechBubbles={speechBubbles} activeSigns={activeSigns} profile={profile}
              getSignEmojiOnly={getSignEmojiOnly} t={t} />

            <PlayerPosition position="south" index={0} timeLeft={timeLeft} activeTurnIdx={activeTurnIdx}
              seats={seats} botHands={botHands} isPlaying={isPlaying} phase={phase} dealerIdx={dealerIdx}
              speechBubbles={speechBubbles} activeSigns={activeSigns} profile={profile}
              playerHand={playerHand} selectedCards={selectedCards} toggleCardSelection={toggleCardSelection}
              getSignEmojiOnly={getSignEmojiOnly} t={t} />

          </div>

          {isPlaying && (
            <div className="senas-dropdown-container">
              <button
                type="button"
                className="btn-senas-toggle"
                onClick={() => setIsSignsOpen(!isSignsOpen)}
                title={t('musGame.openSignsMenu')}
              >
                {t('musGame.signs')}
              </button>
              {isSignsOpen && (
                <div className="senas-popup-menu">
                  <span className="senas-menu-title">{t('musGame.makeSign')}</span>
                  <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('dos_reyes'); setIsSignsOpen(false); }}>
                    {t('musGame.signReyes')}
                  </button>
                  <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('dos_ases'); setIsSignsOpen(false); }}>
                    {t('musGame.signAses')}
                  </button>
                  <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('medias'); setIsSignsOpen(false); }}>
                    {t('musGame.signMedias')}
                  </button>
                  <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('duples'); setIsSignsOpen(false); }}>
                    {t('musGame.signDuples')}
                  </button>
                  <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('31'); setIsSignsOpen(false); }}>
                    {t('musGame.sign31')}
                  </button>
                  <button type="button" className="btn-senas-menu-item" onClick={() => { sendSign('30'); setIsSignsOpen(false); }}>
                    {t('musGame.sign30')}
                  </button>
                </div>
              )}
            </div>
          )}

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

        <aside className={`sidebar-panel ${isMobile ? 'mobile-drawer' : ''} ${isSidebarOpen ? 'is-open' : ''}`}>

          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
              <button className="drawer-close-btn" onClick={() => setIsSidebarOpen(false)}>
                {t('musGame.closePanel')}
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
                {t('musGame.leaveShort')}
              </button>
            </div>
          )}

          <GameScoreBoard score={score} maxRounds={maxRounds} />

          <div className="sound-toggle-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t('musGame.gameSounds')}</span>
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
              {isMuted ? t('musGame.soundOff') : t('musGame.soundOn')}
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
                {t('musGame.history')}
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
                {t('musGame.tableChat')}
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
                      {t('musGame.noMessages')}
                    </div>
                  ) : (
                    chatMessages.map((msg: string, idx: number) => {
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
                    placeholder={t('musGame.writeInTable')}
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
                    {t('musGame.send')}
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
