import { useCallback, useRef, useEffect } from 'react';
import { useMusGameState } from './useMusGameState';
import { useMusWebSocket } from './useMusWebSocket';
import { useMusActions } from './useMusActions';

export const useMusGame = (userId: number) => {
  const state = useMusGameState();
  const leaveRoomRef = useRef<() => void>(() => {});

  const { socketRef, connectWebSocket } = useMusWebSocket({
    userId,
    username: state.seats.find(s => s.userId === userId)?.username || 'Jugador',
    appendLog: state.appendLog,
    setters: {
      setIsPlaying: state.setIsPlaying,
      setPhase: state.setPhase as (v: string) => void,
      setStage: state.setStage,
      setScore: state.setScore,
      setLogs: state.setLogs,
      setChatMessages: state.setChatMessages,
      setSpeechBubbles: state.setSpeechBubbles,
      setPlayerHand: state.setPlayerHand,
      setBotHands: state.setBotHands,
      setSeats: state.setSeats,
      setIsMyTurn: state.setIsMyTurn,
      setActiveTurnIdx: state.setActiveTurnIdx,
      setBetState: state.setBetState,
      setCurrentBetSize: state.setCurrentBetSize,
      setReyesOption: state.setReyesOption,
      setMaxRounds: state.setMaxRounds,
      setRoundsWonUs: state.setRoundsWonUs,
      setRoundsWonThem: state.setRoundsWonThem,
      setTurnDeadline: state.setTurnDeadline,
      setDealerIdx: state.setDealerIdx,
      setLeaveVotes: state.setLeaveVotes,
      setRoundTransition: state.setRoundTransition,
      setRoundTransitionDeadline: state.setRoundTransitionDeadline,
      setIsSearching: state.setIsSearching,
      setQueueSize: state.setQueueSize,
      setRoomId: state.setRoomId,
      setActiveSigns: state.setActiveSigns,
    },
    onLeaveRoom: useCallback(() => leaveRoomRef.current(), []),
  });

  const actions = useMusActions({
    socketRef,
    setSelectedCards: state.setSelectedCards,
    setIsSearching: state.setIsSearching,
    setRoomId: state.setRoomId,
    setIsPlaying: state.setIsPlaying,
    setPhase: state.setPhase as (v: string) => void,
    setLogs: state.setLogs,
    setChatMessages: state.setChatMessages,
    setTurnDeadline: state.setTurnDeadline,
    setActiveSigns: state.setActiveSigns,
    setActiveTurnIdx: state.setActiveTurnIdx,
    connectWebSocket,
  });

  useEffect(() => {
    leaveRoomRef.current = actions.onLeaveRoom;
  }, [actions.onLeaveRoom]);

  return {
    // State
    isPlaying: state.isPlaying,
    phase: state.phase,
    stage: state.stage,
    score: state.score,
    logs: state.logs,
    chatMessages: state.chatMessages,
    selectedCards: state.selectedCards,
    speechBubbles: state.speechBubbles,
    playerHand: state.playerHand,
    botHands: state.botHands,
    roomId: state.roomId,
    seats: state.seats,
    isSearching: state.isSearching,
    queueSize: state.queueSize,
    isMyTurn: state.isMyTurn,
    activeTurnIdx: state.activeTurnIdx,
    betState: state.betState,
    currentBetSize: state.currentBetSize,
    turnDeadline: state.turnDeadline,
    activeSigns: state.activeSigns,
    dealerIdx: state.dealerIdx,
    roundTransition: state.roundTransition,
    roundTransitionDeadline: state.roundTransitionDeadline,
    reyesOption: state.reyesOption,
    maxRounds: state.maxRounds,
    roundsWonUs: state.roundsWonUs,
    roundsWonThem: state.roundsWonThem,
    leaveVotes: state.leaveVotes,

    // Actions
    handleStartMatch: actions.handleStartMatch,
    startNewHand: actions.startNewHand,
    handleUserMusDecision: actions.handleUserMusDecision,
    handleExecuteDiscards: actions.handleExecuteDiscards,
    handleBetAction: actions.handleBetAction,
    onAddBot: actions.onAddBot,
    onRemoveBot: actions.onRemoveBot,
    onJoinRoom: actions.onJoinRoom,
    onCreateRoom: actions.onCreateRoom,
    onStartMatchmaking: actions.onStartMatchmaking,
    onCancelMatchmaking: actions.onCancelMatchmaking,
    onLeaveRoom: actions.onLeaveRoom,
    updateRoomConfig: actions.updateRoomConfig,
    sendChatMessage: actions.sendChatMessage,
    sendSpeechBubble: actions.sendSpeechBubble,
    sendLeaveVote: actions.sendLeaveVote,
    sendSign: actions.sendSign,
    toggleCardSelection: actions.toggleCardSelection,
    connectWebSocket,
  };
};
