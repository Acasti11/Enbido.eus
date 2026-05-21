import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameScore, LogEntry, GamePhase, BettingStage, CardItem } from '../../../types/MusGame';

export interface SeatInfo {
  chair: number;
  username: string;
  isBot: boolean;
  userId: number | null;
}

export const useMusGame = (userId: number) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [phase, setPhase] = useState<GamePhase>('init');
  const [stage, setStage] = useState<BettingStage>('grande');
  const [score, setScore] = useState<GameScore>({ us: 0, them: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<string[]>(['', '', '', '']); // [Tú, Oeste, Norte, Este]

  const [playerHand, setPlayerHand] = useState<CardItem[]>([]);
  const [botHands, setBotHands] = useState<CardItem[][]>([[], [], []]); // [Norte, Oeste, Este] maskable
  
  // Nuevos estados multijugador
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
  const [betState, setBetState] = useState<number>(0);
  const [currentBetSize, setCurrentBetSize] = useState<number>(0);
  const [reyesMode, setReyesMode] = useState<number>(8);

  const socketRef = useRef<WebSocket | null>(null);

  // Obtener el username guardado en localStorage
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const username = savedUser.username || `User-${userId}`;

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [{ id: Math.random().toString(), message }, ...prev]);
  }, []);

  // --- CONEXIÓN DE WEBSOCKET ---

  const connectWebSocket = useCallback((targetRoomId: string, joinAsMatchmaker: boolean = false) => {
    // Si ya existe socket, lo cerramos
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket('ws://localhost:8080/ws-mus');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Conexión de socket establecida con Spring Boot.');
      
      if (joinAsMatchmaker) {
        socket.send(JSON.stringify({
          type: 'MATCHMAKING_JOIN',
          userId,
          username
        }));
      } else {
        socket.send(JSON.stringify({
          type: 'JOIN',
          roomId: targetRoomId,
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
          
          // Mapeamos lances a BettingStage del frontend
          const betStage = data.stage ? data.stage.toLowerCase() : 'grande';
          setStage(betStage as BettingStage);
          
          setScore({ us: data.score.us, them: data.score.them });
          
          // Formateamos logs para UI
          if (data.logs) {
            const uiLogs = data.logs.map((l: string, idx: number) => ({
              id: `${idx}-${l}`,
              message: l
            }));
            setLogs(uiLogs);
          }

          setSpeechBubbles(data.speechBubbles);
          setPlayerHand(data.playerHand);
          setBotHands(data.botHands);
          setSeats(data.seats);
          setIsMyTurn(data.isMyTurn || false);
          setBetState(data.betState || 0);
          setCurrentBetSize(data.currentBetSize || 0);
          if (data.reyesMode !== undefined) {
            setReyesMode(data.reyesMode);
          }
          setIsSearching(false);
        } 
        else if (type === 'QUEUEING') {
          setIsSearching(true);
          setQueueSize(data.queueSize);
        }
        else if (type === 'LEAVED_QUEUE') {
          setIsSearching(false);
          setQueueSize(0);
        }
        else if (type === 'MATCHED') {
          appendLog(`¡Partida emparejada! Conectando a la mesa ${data.roomId}...`);
          setRoomId(data.roomId);
          setIsSearching(false);
          // Reconectamos a la sala real
          connectWebSocket(data.roomId);
        }
        else if (type === 'ERROR') {
          appendLog(`⚠️ Error del Servidor: ${data.message}`);
          setIsSearching(false);
        }

      } catch (err) {
        console.error('Error parseando mensaje WebSocket:', err);
      }
    };

    socket.onclose = () => {
      console.log('Conexión de socket cerrada.');
    };

    socket.onerror = (err) => {
      console.error('Error en el WebSocket de Mus:', err);
      appendLog('⚠️ Error de conexión con el servidor de juegos.');
    };

  }, [userId, username, appendLog]);

  // Cerrar sockets al desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // --- ACCIONES ENVIADAS POR WEBSOCKET ---

  const handleStartMatch = (mode?: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'START_GAME',
        reyesMode: mode !== undefined ? mode : reyesMode
      }));
    }
  };

  const startNewHand = () => {
    // Al ser servidor síncrono, "Nueva mano" se lanza con el mismo trigger
    handleStartMatch(reyesMode);
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

  const onStartMatchmaking = () => {
    setIsSearching(true);
    connectWebSocket('', true);
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
    reyesMode,
    
    setReyesMode,
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
  };
};