import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { BettingStage, GamePhase, SeatInfo } from '@/features/game/types/MusGame';

interface UseMusWebSocketProps {
  userId: number;
  username: string;
  appendLog: (message: string) => void;
  setters: {
    setIsPlaying: (v: boolean) => void;
    setPhase: (v: GamePhase) => void;
    setStage: (v: BettingStage) => void;
    setScore: (v: any) => void;
    setLogs: (v: any[]) => void;
    setChatMessages: (v: string[]) => void;
    setSpeechBubbles: (v: string[]) => void;
    setPlayerHand: (v: any[]) => void;
    setBotHands: (v: any[][]) => void;
    setSeats: (v: SeatInfo[]) => void;
    setIsMyTurn: (v: boolean) => void;
    setActiveTurnIdx: (v: number) => void;
    setBetState: (v: number) => void;
    setCurrentBetSize: (v: number) => void;
    setReyesOption: (v: '4' | '8') => void;
    setMaxRounds: (v: number) => void;
    setRoundsWonUs: (v: number) => void;
    setRoundsWonThem: (v: number) => void;
    setTurnDeadline: (v: number) => void;
    setDealerIdx: (v: number) => void;
    setLeaveVotes: (v: number[]) => void;
    setRoundTransition: (v: any) => void;
    setRoundTransitionDeadline: (v: number) => void;
    setIsSearching: (v: boolean) => void;
    setQueueSize: (v: number) => void;
    setRoomId: (v: string) => void;
    setActiveSigns: (v: any) => void;
  };
  onLeaveRoom: () => void;
}

export const useMusWebSocket = ({
  userId,
  username,
  appendLog,
  setters,
  onLeaveRoom,
}: UseMusWebSocketProps) => {
  const { t } = useTranslation();
  const socketRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback((
    targetRoomId: string,
    joinAsMatchmaker: boolean = false,
    chosenReyes: '4' | '8' = '8'
  ) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsHost = import.meta.env.VITE_WS_URL
      ? import.meta.env.VITE_WS_URL.replace(/^wss?:\/\//, '')
      : isLocalhost
      ? `${window.location.hostname}:8080`
      : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws-mus`;

    console.log('Conectando al WebSocket de Mus a: ' + wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Socket connection established with Spring Boot.');
      if (joinAsMatchmaker) {
        socket.send(JSON.stringify({
          type: 'MATCHMAKING_JOIN',
          userId,
          username,
          reyesOption: chosenReyes
        }));
      } else {
        socket.send(JSON.stringify({
          type: 'JOIN',
          roomId: targetRoomId,
          userId,
          username
        }));
        setters.setRoomId(targetRoomId);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === 'ROOM_STATE') {
          setters.setIsPlaying(data.isPlaying);
          setters.setPhase(data.phase);

          const betStage = data.stage ? data.stage.toLowerCase() : 'grande';
          setters.setStage(betStage as BettingStage);

          setters.setScore({
            us: data.score.us,
            them: data.score.them,
            roundsUs: data.score.roundsUs,
            roundsThem: data.score.roundsThem
          });

          if (data.logs) {
            const uiLogs = data.logs.map((l: string, idx: number) => ({
              id: `${idx}-${l}`,
              message: l
            }));
            setters.setLogs(uiLogs);
          }

          setters.setChatMessages(data.chatMessages || []);
          setters.setSpeechBubbles(data.speechBubbles);
          setters.setPlayerHand(data.playerHand);
          setters.setBotHands(data.botHands);
          setters.setSeats(data.seats);
          setters.setIsMyTurn(data.isMyTurn || false);
          setters.setActiveTurnIdx(data.activeTurnIdx !== undefined ? data.activeTurnIdx : -1);
          setters.setBetState(data.betState || 0);
          setters.setCurrentBetSize(data.currentBetSize || 0);
          setters.setReyesOption(data.reyesOption || '8');
          setters.setMaxRounds(data.maxRounds || 3);
          setters.setRoundsWonUs(data.roundsWonUs || 0);
          setters.setRoundsWonThem(data.roundsWonThem || 0);
          setters.setTurnDeadline(data.turnDeadline || 0);
          setters.setDealerIdx(data.dealerIdx !== undefined ? data.dealerIdx : -1);
          setters.setLeaveVotes(data.leaveVotes || []);
          setters.setRoundTransition(data.roundTransition || null);
          setters.setRoundTransitionDeadline(data.roundTransitionDeadline || 0);
          setters.setIsSearching(false);
        }
        else if (type === 'GAME_CANCELLED') {
          appendLog(t('musGame.friendlyExitSuccess') || 'La partida ha sido cancelada de mutuo acuerdo.');
          alert(t('musGame.friendlyExitSuccess') || 'La partida ha sido cancelada de mutuo acuerdo.');
          onLeaveRoom();
        }
        else if (type === 'QUEUEING') {
          setters.setIsSearching(true);
          setters.setQueueSize(data.queueSize);
        }
        else if (type === 'MUS_SIGN') {
          const { chair, signType } = data;
          setters.setActiveSigns((prev: any) => ({ ...prev, [chair]: signType }));
          setTimeout(() => {
            setters.setActiveSigns((prev: any) => {
              const next = { ...prev };
              if (next[chair] === signType) {
                delete next[chair];
              }
              return next;
            });
          }, 1200);
        }
        else if (type === 'LEAVED_QUEUE') {
          setters.setIsSearching(false);
          setters.setQueueSize(0);
        }
        else if (type === 'MATCHED') {
          appendLog(t('musGame.matchFound', { roomId: data.roomId }));
          setters.setRoomId(data.roomId);
          setters.setIsSearching(false);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'JOIN',
              roomId: data.roomId,
              userId,
              username
            }));
          }
        }
        else if (type === 'ERROR') {
          appendLog(t('musGame.serverError', { message: data.message }));
          setters.setIsSearching(false);
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
  }, [userId, username, appendLog, t, setters, onLeaveRoom]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    socketRef,
    connectWebSocket,
  };
};
