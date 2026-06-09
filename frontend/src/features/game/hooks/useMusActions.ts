import type { MutableRefObject } from 'react';

interface UseMusActionsProps {
  socketRef: MutableRefObject<WebSocket | null>;
  setSelectedCards: (v: string[] | ((prev: string[]) => string[])) => void;
  setIsSearching: (v: boolean) => void;
  setRoomId: (v: string) => void;
  setIsPlaying: (v: boolean) => void;
  setPhase: (v: string) => void;
  setLogs: (v: any[]) => void;
  setChatMessages: (v: string[]) => void;
  setTurnDeadline: (v: number) => void;
  setActiveSigns: (v: any) => void;
  setActiveTurnIdx: (v: number) => void;
  connectWebSocket: (roomId: string, joinAsMatchmaker?: boolean, chosenReyes?: '4' | '8') => void;
}

export const useMusActions = ({
  socketRef,
  setSelectedCards,
  setIsSearching,
  setRoomId,
  setIsPlaying,
  setPhase,
  setLogs,
  setChatMessages,
  setTurnDeadline,
  setActiveSigns,
  setActiveTurnIdx,
  connectWebSocket,
}: UseMusActionsProps) => {
  const handleStartMatch = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'START_GAME' }));
    }
  };

  const startNewHand = () => {
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

  const onRemoveBot = (chair: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'REMOVE_BOT',
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
    setSelectedCards((prev: string[]) =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  return {
    handleStartMatch,
    startNewHand,
    handleUserMusDecision,
    handleExecuteDiscards,
    handleBetAction,
    onAddBot,
    onRemoveBot,
    onJoinRoom,
    onCreateRoom,
    onStartMatchmaking,
    onCancelMatchmaking,
    onLeaveRoom,
    updateRoomConfig,
    sendChatMessage,
    sendSpeechBubble,
    sendLeaveVote,
    sendSign,
    toggleCardSelection,
  };
};
