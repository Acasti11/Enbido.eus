import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameScore, LogEntry, GamePhase, BettingStage, CardItem } from '../../../types/MusGame';

export interface SeatInfo {
  chair: number;
  username: string;
  isBot: boolean;
  userId: number | null;
}

export const useMusGame = (userId: number) => {
  const { t } = useTranslation();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [phase, setPhase] = useState<GamePhase>('init');
  const [stage, setStage] = useState<BettingStage>('grande');
  const [score, setScore] = useState<GameScore>({ us: 0, them: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<string[]>(['', '', '', '']); // [You, West, North, East]

  const [playerHand, setPlayerHand] = useState<CardItem[]>([]);
  const [botHands, setBotHands] = useState<CardItem[][]>([[], [], []]); // [North, West, East] maskable
  
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
  
  // States for king configuration and round marker
  const [reyesOption, setReyesOption] = useState<'4' | '8'>('8');
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [roundsWonUs, setRoundsWonUs] = useState<number>(0);
  const [roundsWonThem, setRoundsWonThem] = useState<number>(0);
  const [leaveVotes, setLeaveVotes] = useState<number[]>([]);

  const socketRef = useRef<WebSocket | null>(null);

  // Get username stored in localStorage
  const username = localStorage.getItem('username') || `User-${userId}`;

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [{ id: Math.random().toString(), message }, ...prev]);
  }, []);

  useEffect(() => {
    localStorage.setItem('isGameActive', roomId !== '' ? 'true' : 'false');
    window.dispatchEvent(new Event('game_state_changed'));
  }, [roomId]);

  // --- WEBSOCKET CONNECTION ---

  const connectWebSocket = useCallback((targetRoomId: string, joinAsMatchmaker: boolean = false, chosenReyes: '4' | '8' = '8') => {
    // Close existing socket if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl;
    if (window.location.port === '5173') {
      wsUrl = `${wsProtocol}//${window.location.hostname}:8080/ws-mus`;
    } else {
      wsUrl = `${wsProtocol}//${window.location.host}/ws-mus`;
    }

    console.log('Conectando al WebSocket de Mus a: ' + wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Socket connection established with Spring Boot.');
      const token = localStorage.getItem('token');
      
      if (joinAsMatchmaker) {
        socket.send(JSON.stringify({
          type: 'MATCHMAKING_JOIN',
          token,
          userId,
          username,
          reyesOption: chosenReyes
        }));
      } else {
        socket.send(JSON.stringify({
          type: 'JOIN',
          roomId: targetRoomId,
          token,
          userId,
          username
        }));
        setRoomId(targetRoomId);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === 'ROOM_STATE') {
          setIsPlaying(data.isPlaying);
          setPhase(data.phase);
          
          // Map stages to frontend BettingStage
          const betStage = data.stage ? data.stage.toLowerCase() : 'grande';
          setStage(betStage as BettingStage);
          
          setScore({
            us: data.score.us,
            them: data.score.them,
            roundsUs: data.score.roundsUs,
            roundsThem: data.score.roundsThem
          });
          
          // Format logs for UI
          if (data.logs) {
            const uiLogs = data.logs.map((l: string, idx: number) => ({
              id: `${idx}-${l}`,
              message: l
            }));
            setLogs(uiLogs);
          }

          setChatMessages(data.chatMessages || []);
          setSpeechBubbles(data.speechBubbles);
          setPlayerHand(data.playerHand);
          setBotHands(data.botHands);
          setSeats(data.seats);
          setIsMyTurn(data.isMyTurn || false);
          setActiveTurnIdx(data.activeTurnIdx !== undefined ? data.activeTurnIdx : -1);
          setBetState(data.betState || 0);
          setCurrentBetSize(data.currentBetSize || 0);
          setReyesOption(data.reyesOption || '8');
          setMaxRounds(data.maxRounds || 3);
          setRoundsWonUs(data.roundsWonUs || 0);
          setRoundsWonThem(data.roundsWonThem || 0);
          setTurnDeadline(data.turnDeadline || 0);
          setDealerIdx(data.dealerIdx !== undefined ? data.dealerIdx : -1);
          setLeaveVotes(data.leaveVotes || []);
          setIsSearching(false);
        } 
        else if (type === 'GAME_CANCELLED') {
          appendLog(t('musGame.friendlyExitSuccess') || 'La partida ha sido cancelada de mutuo acuerdo.');
          alert(t('musGame.friendlyExitSuccess') || 'La partida ha sido cancelada de mutuo acuerdo.');
          onLeaveRoom();
        }
        else if (type === 'QUEUEING') {
          setIsSearching(true);
          setQueueSize(data.queueSize);
        }
        else if (type === 'MUS_SIGN') {
          const { chair, signType } = data;
          setActiveSigns((prev) => ({ ...prev, [chair]: signType }));
          setTimeout(() => {
            setActiveSigns((prev) => {
              const next = { ...prev };
              if (next[chair] === signType) {
                delete next[chair];
              }
              return next;
            });
          }, 1200);
        }
        else if (type === 'LEAVED_QUEUE') {
          setIsSearching(false);
          setQueueSize(0);
        }
        else if (type === 'MATCHED') {
          appendLog(t('musGame.matchFound', { roomId: data.roomId }));
          setRoomId(data.roomId);
          setIsSearching(false);
          // Send a JOIN on the same socket so the server confirms our seat
          // and broadcasts the full ROOM_STATE to us (handles edge cases
          // where the initial broadcast might not reach us).
          const token = localStorage.getItem('token');
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'JOIN',
              roomId: data.roomId,
              token,
              userId,
              username
            }));
          }
        }
        else if (type === 'ERROR') {
          appendLog(t('musGame.serverError', { message: data.message }));
          setIsSearching(false);
        }

      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('Socket connection closed.');
    };

    socket.onerror = (err) => {
      console.error('Error in Mus WebSocket:', err);
      appendLog(t('musGame.connectionError'));
    };

  }, [userId, username, appendLog, t]);

  // Close sockets on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // --- ACTIONS SENT VIA WEBSOCKET ---

  const handleStartMatch = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'START_GAME' }));
    }
  };

  const startNewHand = () => {
    // Since it is a synchronous server, "New hand" uses the same trigger
    handleStartMatch();
  };

  const handleUserMusDecision = (wantsMus: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'DECISION_MUS',
        wantsMus
      }));
    }
  };

  const handleExecuteDiscards = (cardIds: string[]) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'DISCARD',
        cardIds
      }));
      setSelectedCards([]);
    }
  };

  const handleBetAction = (action: 'Paso' | 'Envido' | 'Ordago' | 'Quiero' | 'No Quiero') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'BET',
        action
      }));
    }
  };

  const onAddBot = (chair: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ADD_BOT',
        chair
      }));
    }
  };

  const onJoinRoom = (roomCode: string) => {
    connectWebSocket(roomCode);
  };

  const onCreateRoom = (roomCode: string) => {
    connectWebSocket(roomCode);
  };

  const onStartMatchmaking = (selectedReyes: '4' | '8' = '8') => {
    setIsSearching(true);
    connectWebSocket('', true, selectedReyes);
  };

  const updateRoomConfig = (reyes: '4' | '8', rounds: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'UPDATE_CONFIG',
        reyesOption: reyes,
        maxRounds: rounds
      }));
    }
  };

  const onCancelMatchmaking = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'MATCHMAKING_LEAVE' }));
    }
    setIsSearching(false);
    setRoomId('');
  };

  const onLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setRoomId('');
    setIsPlaying(false);
    setPhase('init');
    setLogs([]);
    setChatMessages([]);
    setTurnDeadline(0);
    setActiveSigns({});
    setActiveTurnIdx(-1);
  };

  const sendChatMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CHAT',
        message
      }));
    }
  };

  const sendSpeechBubble = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SPEECH_BUBBLE',
        message
      }));
    }
  };

  const sendLeaveVote = (vote: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'LEAVE_VOTE',
        vote
      }));
    }
  };

  const sendSign = (signType: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SEND_SIGN',
        signType
      }));
    }
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  return {
    isPlaying,
    phase,
    stage,
    score,
    logs,
    chatMessages,
    selectedCards,
    speechBubbles,
    playerHand,
    botHands,
    roomId,
    seats,
    isSearching,
    queueSize,
    username,
    isMyTurn,
    betState,
    currentBetSize,
    
    reyesOption,
    maxRounds,
    roundsWonUs,
    roundsWonThem,
    activeSigns,
    turnDeadline,
    activeTurnIdx,
    dealerIdx,
    
    handleStartMatch,
    startNewHand,
    handleUserMusDecision,
    handleExecuteDiscards,
    handleBetAction,
    toggleCardSelection,
    onAddBot,
    onJoinRoom,
    onCreateRoom,
    onStartMatchmaking,
    onCancelMatchmaking,
    onLeaveRoom,
    updateRoomConfig,
    sendChatMessage,
    sendSpeechBubble,
    sendSign,
    leaveVotes,
    sendLeaveVote,
  };
};
