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
import GameOverModal from '../../components/layout/GameOverModal';

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
    <svg className="timer-svg" width="64" height="64" viewBox="0 0 64 64">
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
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
};

const MiniDeckToken: React.FC<{ size?: number; className?: string }> = ({ size = 28, className }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`mini-deck-token ${className || ''}`}>
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

  const absChair = seats[index]?.chair;
  const isTurnActive = absChair !== undefined && activeTurnIdx === absChair;
  const signType = absChair !== undefined ? activeSigns[absChair] : undefined;
  const isDealer = absChair !== undefined && dealerIdx === absChair;

  let avatarSkinClass = '';
  if (profile?.equippedAvatarItemId === 1) avatarSkinClass = 'avatar-ring-gold';
  else if (profile?.equippedAvatarItemId === 2) avatarSkinClass = 'avatar-ring-green';
  else if (profile?.equippedAvatarItemId === 7) avatarSkinClass = 'avatar-ring-ikurrina';
  else if (profile?.equippedAvatarItemId === 8) avatarSkinClass = 'avatar-ring-karta';

  const avatarClass = isSelf
    ? `player-theme ${signType ? 'has-active-sign' : ''} ${avatarSkinClass}`
    : position === 'north'
    ? `partner-theme ${signType ? 'has-active-sign' : ''}`
    : `rival-theme ${signType ? 'has-active-sign' : ''}`;

  return (
    <div className={`player-position position-${position} ${isTurnActive ? 'active-zone' : ''}`}>
      <div className="player-avatar-card">
        <div className="player-avatar-wrapper">
          <TimerCircle timeLeft={timeLeft} isActive={isTurnActive} />
          <div className={`player-avatar-circle ${avatarClass}`}>
            {username.slice(0, 2).toUpperCase()}
          </div>
          {isTurnActive && timeLeft > 0 && (
            <div className={`avatar-countdown-badge ${timeLeft <= 3 ? 'low-time' : timeLeft <= 6 ? 'medium-time' : ''}`}>
              {timeLeft}s
            </div>
          )}
        </div>
        <div className="player-avatar-details">
          <span className="player-name-label">{displayName}</span>
          {isSelf && profile?.equippedTitleItemId === 5 && <span className="player-title-badge player-title-badge--green">{t('musGame.titleHandia')}</span>}
          {isSelf && profile?.equippedTitleItemId === 6 && <span className="player-title-badge player-title-badge--gold">{t('musGame.titleEnbidoMaisu')}</span>}
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
      {isDealer && (
        <div className="dealer-baraja-token" title={t('musGame.dealerTooltip')}>
          <MiniDeckToken />
        </div>
      )}
      {speechBubbles[index] && <div className="speech-bubble show">{speechBubbles[index]}</div>}
      {signType && (
        <div className="mus-sign-badge pop-in">
          <div className="mus-sign-badge-glow"></div>
          <span className="mus-sign-badge-text">
            {getSignEmojiOnly(signType)}
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

  // New states for Game Over Pop-up summary
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [winningProfiles, setWinningProfiles] = useState<{ [userId: number]: any }>({});
  const [initialProfile, setInitialProfile] = useState<any>(null);
  const [finalMatchData, setFinalMatchData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

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
    onAddBot, onRemoveBot, onJoinRoom, onCreateRoom, onStartMatchmaking, onCancelMatchmaking, onLeaveRoom,
    reyesOption, maxRounds, updateRoomConfig, sendChatMessage, sendSign,
    activeSigns, turnDeadline, activeTurnIdx, dealerIdx,
    leaveVotes, sendLeaveVote
  } = useMusGame(currentUserId);

  // Fetch initial profile when match starts
  useEffect(() => {
    if (isPlaying && initialProfile === null) {
      const fetchInitial = async () => {
        try {
          const res = await api.get('/usuarios/me/profile');
          setInitialProfile(res.data);
        } catch (err) {
          console.error('Error fetching initial profile:', err);
        }
      };
      fetchInitial();
    }
  }, [isPlaying, initialProfile]);

  const prevIsPlaying = useRef(isPlaying);

  // Detect match completion
  useEffect(() => {
    if (prevIsPlaying.current === true && isPlaying === false && roomId !== '') {
      const handleGameFinished = async () => {
        // Freeze final match stats so they persist on modal regardless of lobby resets
        const currentSeats = [...seats];
        const currentRoundsUs = score.roundsUs || 0;
        const currentRoundsThem = score.roundsThem || 0;

        setFinalMatchData({
          roundsWonUs: currentRoundsUs,
          roundsWonThem: currentRoundsThem,
          maxRounds: maxRounds,
          scoreUs: score.us,
          scoreThem: score.them,
          seats: currentSeats
        });

        // Open modal immediately to prevent delays
        setIsGameOverOpen(true);
        setIsProfileLoading(true);

        try {
          // Determine winning couple
          const isUsWinner = currentRoundsUs > currentRoundsThem;
          const winningChairs = isUsWinner ? [0, 2] : [1, 3];
          const winners = currentSeats.filter(s => winningChairs.includes(s.chair));

          // Run all requests in parallel
          const profilePromises: Promise<any>[] = [];

          // 1. Fetch our own updated profile for ELO change
          const mePromise = api.get('/usuarios/me/profile').then(res => {
            const finalProfile = res.data;
            const beforeElo = initialProfile ? initialProfile.elo : profile?.elo;
            if (beforeElo !== undefined && finalProfile.elo !== undefined) {
              setEloChange(finalProfile.elo - beforeElo);
            }
            setProfile(finalProfile);
          }).catch(err => {
            console.error('Error fetching final player profile:', err);
          });
          profilePromises.push(mePromise);

          // 2. Fetch profiles of non-bot winners
          const profilesMap: { [userId: number]: any } = {};
          winners.forEach(w => {
            if (w.userId && !w.isBot) {
              const winnerPromise = api.get(`/usuarios/${w.userId}/profile`).then(res => {
                profilesMap[w.userId!] = res.data;
              }).catch(err => {
                console.error(`Error fetching winner ${w.username} profile:`, err);
              });
              profilePromises.push(winnerPromise);
            }
          });

          // Wait for all fetches to resolve in parallel
          await Promise.all(profilePromises);
          setWinningProfiles(profilesMap);
        } catch (err) {
          console.error('Error handling post-game profile loading:', err);
        } finally {
          setIsProfileLoading(false);
        }
      };

      handleGameFinished();
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying, roomId, score, maxRounds, seats, initialProfile, profile]);

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

  const renderGameOverModal = () => {
    if (!finalMatchData) return null;
    return (
      <GameOverModal
        isOpen={isGameOverOpen}
        onClose={() => {
          setIsGameOverOpen(false);
          setFinalMatchData(null);
          setEloChange(null);
          setInitialProfile(null);
          setIsProfileLoading(false);
        }}
        onLeave={() => {
          onLeaveRoom();
          setIsGameOverOpen(false);
          setFinalMatchData(null);
          setEloChange(null);
          setInitialProfile(null);
          setIsProfileLoading(false);
        }}
        roundsWonUs={finalMatchData.roundsWonUs}
        roundsWonThem={finalMatchData.roundsWonThem}
        maxRounds={finalMatchData.maxRounds}
        scoreUs={finalMatchData.scoreUs}
        scoreThem={finalMatchData.scoreThem}
        seats={finalMatchData.seats}
        eloChange={eloChange}
        winningProfiles={winningProfiles}
        isLoading={isProfileLoading}
      />
    );
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [isPortraitMobile, setIsPortraitMobile] = useState(
    window.innerWidth < 768 && window.innerHeight > window.innerWidth
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
      setIsPortraitMobile(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
    };
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

  const mySeat = seats.find(s => s.userId === currentUserId);
  const myChair = mySeat ? mySeat.chair : -1;
  const hasVotedToLeave = myChair !== -1 && leaveVotes.includes(myChair);

  const handleExitRequest = () => {
    if (!isPlaying) {
      onLeaveRoom();
      return;
    }

    if (hasVotedToLeave) {
      if (window.confirm(t('musGame.cancelExitVoteConfirm') || '¿Quieres retirar tu voto de salida?')) {
        sendLeaveVote(false);
      }
    } else {
      if (window.confirm(t('musGame.voteExitConfirm') || 'Si sales de la partida en curso serás penalizado, a menos que ambas parejas decidan salir amistosamente de mutuo acuerdo. ¿Quieres proponer una salida amistosa?')) {
        sendLeaveVote(true);
      }
    }
  };

  if (isPortraitMobile) {
    return (
      <div className="rotate-device-overlay">
        <div className="rotate-device-content">
          <div className="rotate-phone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <p className="rotate-device-text">{t('musGame.rotateDevice')}</p>
        </div>
      </div>
    );
  }

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
        {renderGameOverModal()}
      </>
    );
  }

  if (!isPlaying) {
    return (
      <>
        <LobbyWaitingRoom
          roomId={roomId}
          seats={seats}
          currentUserId={currentUserId}
          onAddBot={onAddBot}
          onRemoveBot={onRemoveBot}
          onStartGame={handleStartMatch}
          onLeaveRoom={onLeaveRoom}
          reyesOption={reyesOption}
          maxRounds={maxRounds}
          onUpdateConfig={updateRoomConfig}
        />
        {renderGameOverModal()}
      </>
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

          {isPlaying && leaveVotes.length > 0 && (
            <div className="friendly-exit-banner">
              <span>{t('musGame.friendlyExitBanner', { count: leaveVotes.length })}</span>
              <button
                className={`friendly-exit-btn-action ${hasVotedToLeave ? 'friendly-exit-btn-action--cancel' : ''}`}
                onClick={handleExitRequest}
              >
                {hasVotedToLeave
                  ? t('musGame.cancelExitVote')
                  : t('musGame.voteExit')}
              </button>
            </div>
          )}

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
                  onClick={handleExitRequest}
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
            <div className="drawer-header-actions">
              <button className="drawer-close-btn" onClick={() => setIsSidebarOpen(false)}>
                {t('musGame.closePanel')}
              </button>
              <button
                className="leave-felt-btn leave-felt-btn--mobile"
                onClick={handleExitRequest}
              >
                {t('musGame.leaveShort')}
              </button>
            </div>
          )}

          <GameScoreBoard score={score} maxRounds={maxRounds} />

          <div className="sound-toggle-container">
            <span className="sound-toggle-label">{t('musGame.gameSounds')}</span>
            <button
              onClick={toggleMute}
              className={`sound-toggle-btn ${isMuted ? 'sound-toggle-btn--muted' : 'sound-toggle-btn--active'}`}
            >
              {isMuted ? t('musGame.soundOff') : t('musGame.soundOn')}
            </button>
          </div>

          <div className="game-logs-widget">
            <div className="logs-header-tabs">
              <button
                onClick={() => setActiveTab('logs')}
                className={`logs-tab-btn ${activeTab === 'logs' ? 'logs-tab-btn--active' : ''}`}
              >
                {t('musGame.history')}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
              >
                {t('musGame.tableChat')}
              </button>
            </div>

            {activeTab === 'logs' ? (
              <GameConsoleLogs logs={logs} />
            ) : (
              <div className="game-chat-tab-container">
                <div
                  className="game-chat-messages-box"
                  ref={chatEndRef}
                >
                  {chatMessages.length === 0 ? (
                    <div className="game-chat-empty-msg">
                      {t('musGame.noMessages')}
                    </div>
                  ) : (
                    chatMessages.map((msg: string, idx: number) => {
                      const parts = msg.split(': ');
                      const sender = parts[0];
                      const content = parts.slice(1).join(': ');
                      const isMe = sender.trim().toLowerCase() === username.trim().toLowerCase();

                      return (
                        <div key={idx} className={`game-chat-message ${isMe ? 'game-chat-message--me' : 'game-chat-message--other'}`}>
                          <strong className={`game-chat-message-sender ${isMe ? 'game-chat-message-sender--me' : 'game-chat-message-sender--other'}`}>
                            {sender}
                          </strong>
                          <span className="game-chat-message-content">{content}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendChat} className="game-chat-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t('musGame.writeInTable')}
                
                  />
                  <button type="submit" className="game-chat-submit-btn">
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

      {renderGameOverModal()}
    </>
  );
};

export default MusGamePage;
