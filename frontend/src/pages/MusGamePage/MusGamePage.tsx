import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import GameScoreBoard from './components/GameScoreBoard';
import GameConsoleLogs from './components/GameConsoleLogs';
import ActionPanel from './components/ActionPanel';
import PlayerHand from './components/PlayerHand';
import PremiumLobby from './components/PremiumLobby';
import LobbyWaitingRoom from './components/LobbyWaitingRoom';
import { useMusGame } from './hooks/useMusGame';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';
import './styles/mus-game.css';
import { useSeo } from '../../hooks/useSeo';
import GameOverModal from '../../components/layout/GameOverModal';
import { RoundTransitionOverlay } from './components/RoundTransitionOverlay';

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
  isSignsOpen?: boolean;
  setIsSignsOpen?: (isOpen: boolean) => void;
  sendSign?: (signKey: string) => void;
}> = ({
  position, index, timeLeft, activeTurnIdx, seats, botHands, isPlaying,
  phase, dealerIdx, speechBubbles, activeSigns, profile, playerHand,
  selectedCards, toggleCardSelection, getSignEmojiOnly, t,
  isSignsOpen, setIsSignsOpen, sendSign
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
  // In Mus, "mano" is the player to the right of dealer (starts speaking first)
  const manoIdx = (dealerIdx + 1) % 4;
  const isMano = absChair !== undefined && manoIdx === absChair;

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
      <div className="player-profile-row">
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
            {signType && (
              <div className="mus-sign-badge pop-in">
                <div className="mus-sign-badge-glow"></div>
                <span className="mus-sign-badge-text">
                  {getSignEmojiOnly(signType)}
                </span>
              </div>
            )}
            {isMano && (
              <div className="mano-badge" title={t('musGame.manoTooltip')}>
                <span className="mano-badge__label">{t('musGame.manoLabel')}</span>
                <span className="mano-badge__sub">{t('musGame.manoSub')}</span>
              </div>
            )}
          </div>
          <div className="player-avatar-details">
            <span className="player-name-label">{displayName}</span>
            {isSelf && profile?.equippedTitleItemId === 5 && <span className="player-title-badge player-title-badge--green">{t('musGame.titleHandia')}</span>}
            {isSelf && profile?.equippedTitleItemId === 6 && <span className="player-title-badge player-title-badge--gold">{t('musGame.titleEnbidoMaisu')}</span>}
          </div>
        </div>

        {isSelf && isPlaying && sendSign && setIsSignsOpen && (
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
      {speechBubbles[index] && <div className="speech-bubble show">{speechBubbles[index]}</div>}
    </div>
  );
};

const getOrientationText = (lang: string) => {
  const isBasque = lang === 'eu' || lang.startsWith('eu') || lang === 'eus';
  const isFrench = lang === 'fr' || lang.startsWith('fr');
  if (isBasque) {
    return {
      title: 'Orientazio horizontala behar da',
      subtitle: 'Mesedez, biratu gailua zeharka Mus-era jolasteko.'
    };
  }
  if (isFrench) {
    return {
      title: 'Orientation paysage requise',
      subtitle: 'Veuillez pivoter votre appareil pour jouer au Mus.'
    };
  }
  if (lang === 'en' || lang.startsWith('en')) {
    return {
      title: 'Landscape Mode Required',
      subtitle: 'Please tilt your device to landscape orientation to play Mus.'
    };
  }
  return {
    title: 'Orientación Horizontal Requerida',
    subtitle: 'Por favor, inclina tu pantalla en horizontal para jugar al Mus.'
  };
};

const OrientationOverlay: React.FC<{ lang: string }> = ({ lang }) => {
  const texts = getOrientationText(lang);
  return (
    <div className="orientation-overlay">
      <div className="orientation-overlay__content">
        <div className="orientation-overlay__phone-wrapper">
          <svg className="orientation-overlay__phone-svg" viewBox="0 0 100 100" width="120" height="120">
            <rect className="phone-rect" x="35" y="15" width="30" height="60" rx="5" ry="5" fill="none" stroke="var(--color-gold)" strokeWidth="3" />
            <circle className="phone-button" cx="50" cy="70" r="2" fill="var(--color-gold)" />
            <path className="rotate-arrow" d="M25 45 A 25 25 0 0 1 75 45" fill="none" stroke="var(--color-text-white)" strokeWidth="3" strokeDasharray="5,5" />
            <polygon className="rotate-arrow-head" points="75,45 70,38 80,38" fill="var(--color-text-white)" />
          </svg>
        </div>
        <h2 className="orientation-overlay__title">{texts.title}</h2>
        <p className="orientation-overlay__subtitle">{texts.subtitle}</p>
      </div>
    </div>
  );
};

const MusGamePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isPortraitOnMobile, setIsPortraitOnMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMob = window.innerWidth <= 768;
      const isPort = window.innerHeight > window.innerWidth;
      setIsPortraitOnMobile(isMob && isPort);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

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

  const { user, isLoading: isAuthLoading } = useAuth();
  const currentUserId = user?.userId || 0;
  const [profile, setProfile] = useState<any>(null);

  // New states for Game Over Pop-up summary
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [coinsChange, setCoinsChange] = useState<number | null>(null);
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
    roundTransition, roundTransitionDeadline,
    leaveVotes, sendLeaveVote
  } = useMusGame(currentUserId);

  const { closeChat, setIsInGame } = useChat();

  // Close chat when entering a match, block chat during game
  useEffect(() => {
    if (isPlaying) {
      closeChat();
      setIsInGame(true);
    } else {
      setIsInGame(false);
    }
  }, [isPlaying, closeChat, setIsInGame]);

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

          // 1. Fetch our own updated profile for ELO and coins change
          const mePromise = api.get('/usuarios/me/profile').then(res => {
            const finalProfile = res.data;
            const beforeElo = initialProfile ? initialProfile.elo : profile?.elo;
            if (beforeElo !== undefined && finalProfile.elo !== undefined) {
              setEloChange(finalProfile.elo - beforeElo);
            }
            const beforeCoins = initialProfile ? initialProfile.coins : profile?.coins;
            if (beforeCoins !== undefined && finalProfile.coins !== undefined) {
              setCoinsChange(finalProfile.coins - beforeCoins);
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
          setCoinsChange(null);
          setInitialProfile(null);
          setIsProfileLoading(false);
        }}
        onLeave={() => {
          onLeaveRoom();
          setIsGameOverOpen(false);
          setFinalMatchData(null);
          setEloChange(null);
          setCoinsChange(null);
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
        coinsChange={coinsChange}
        winningProfiles={winningProfiles}
        isLoading={isProfileLoading}
      />
    );
  };


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

  const handleTransitionComplete = () => {
    // Auto-start is handled by backend timer, but user can click through
    if (phase === 'round-over') startNewHand();
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

  if (isAuthLoading || currentUserId === 0) {
    return (
      <div className="mus-game__loading">
        <div className="mus-game__spinner" />
        <p>{t('common.loading')}</p>
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
      {isPortraitOnMobile && <OrientationOverlay lang={i18n.language} />}
      <div className="mus-view-container">

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

          {/* Round transition overlay */}
          {roundTransition && phase === 'round-over' && (
            <RoundTransitionOverlay
              transition={roundTransition}
              deadline={roundTransitionDeadline}
              onComplete={handleTransitionComplete}
              t={t}
            />
          )}

          <div className="game-felt-board">

            <div className="felt-center-emblem">
              <h1 className="felt-logo">ENBIDO</h1>
              <span className="felt-sub">{t('musGame.musTable')}</span>
              <button
                className="leave-felt-btn"
                onClick={handleExitRequest}
              >
                {t('musGame.leaveTableShort')}
              </button>
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
              getSignEmojiOnly={getSignEmojiOnly} t={t}
              isSignsOpen={isSignsOpen} setIsSignsOpen={setIsSignsOpen} sendSign={sendSign} />

          </div>

        </div>

        <aside className="sidebar-panel">

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
                className={`logs-tab-btn ${activeTab === 'chat' ? 'logs-tab-btn--active' : ''}`}
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
                    className="game-chat-input"
                  />
                  <button type="submit" className="game-chat-submit-btn">
                    {t('musGame.send')}
                  </button>
                </form>
              </div>
            )}
          </div>

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
        </aside>

      </div>

      {renderGameOverModal()}
    </>
  );
};

export default MusGamePage;
