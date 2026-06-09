import { useState, useCallback } from 'react';
import type { GameScore, LogEntry, GamePhase, BettingStage, CardItem } from '@/features/game/types/MusGame';
import type { SeatInfo } from '@/features/game/types/MusGame';

export const useMusGameState = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [phase, setPhase] = useState<GamePhase>('init');
  const [stage, setStage] = useState<BettingStage>('grande');
  const [score, setScore] = useState<GameScore>({ us: 0, them: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<string[]>(['', '', '', '']);

  const [playerHand, setPlayerHand] = useState<CardItem[]>([]);
  const [botHands, setBotHands] = useState<CardItem[][]>([[], [], []]);

  // Multiplayer states
  const [roomId, setRoomId] = useState<string>('');
  const [seats, setSeats] = useState<SeatInfo[]>([
    { chair: 0, username: 'Vacío', isBot: false, userId: null },
    { chair: 1, username: 'Vacío', isBot: false, userId: null },
    { chair: 2, username: 'Vacío', isBot: false, userId: null },
    { chair: 3, username: 'Vacío', isBot: false, userId: null },
  ]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [queueSize, setQueueSize] = useState<number>(0);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(-1);
  const [betState, setBetState] = useState<number>(0);
  const [currentBetSize, setCurrentBetSize] = useState<number>(0);
  const [turnDeadline, setTurnDeadline] = useState<number>(0);
  const [activeSigns, setActiveSigns] = useState<{ [chair: number]: string }>({});
  const [dealerIdx, setDealerIdx] = useState<number>(-1);

  // Round transition state (between hands)
  const [roundTransition, setRoundTransition] = useState<any>(null);
  const [roundTransitionDeadline, setRoundTransitionDeadline] = useState<number>(0);

  // States for king configuration and round marker
  const [reyesOption, setReyesOption] = useState<'4' | '8'>('8');
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [roundsWonUs, setRoundsWonUs] = useState<number>(0);
  const [roundsWonThem, setRoundsWonThem] = useState<number>(0);
  const [leaveVotes, setLeaveVotes] = useState<number[]>([]);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [{ id: Math.random().toString(), message }, ...prev]);
  }, []);

  return {
    isPlaying, setIsPlaying,
    phase, setPhase,
    stage, setStage,
    score, setScore,
    logs, setLogs,
    chatMessages, setChatMessages,
    selectedCards, setSelectedCards,
    speechBubbles, setSpeechBubbles,
    playerHand, setPlayerHand,
    botHands, setBotHands,
    roomId, setRoomId,
    seats, setSeats,
    isSearching, setIsSearching,
    queueSize, setQueueSize,
    isMyTurn, setIsMyTurn,
    activeTurnIdx, setActiveTurnIdx,
    betState, setBetState,
    currentBetSize, setCurrentBetSize,
    turnDeadline, setTurnDeadline,
    activeSigns, setActiveSigns,
    dealerIdx, setDealerIdx,
    roundTransition, setRoundTransition,
    roundTransitionDeadline, setRoundTransitionDeadline,
    reyesOption, setReyesOption,
    maxRounds, setMaxRounds,
    roundsWonUs, setRoundsWonUs,
    roundsWonThem, setRoundsWonThem,
    leaveVotes, setLeaveVotes,
    appendLog,
  };
};
