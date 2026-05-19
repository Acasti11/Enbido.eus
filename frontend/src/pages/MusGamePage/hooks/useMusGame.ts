import { useState, useCallback } from 'react';
import type { GameScore, LogEntry, GamePhase, BettingStage } from '../../../types/MusGame';
import { useGameApi } from './useGameApi';

const CONST_MAX_SCORE = 30;

export const useMusGame = (userId: number) => {
  const { createNewGame, updateScore } = useGameApi();
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [score, setScore] = useState<GameScore>({ us: 0, them: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [phase, setPhase] = useState<GamePhase>('init');
  const [stage, setStage] = useState<BettingStage>('grande');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [{ id: Math.random().toString(), message }, ...prev]);
  }, []);

  const persistGameState = async (newUs: number, newThem: number, gameId: number) => {
    const isFinished = newUs >= CONST_MAX_SCORE || newThem >= CONST_MAX_SCORE;
    await updateScore(gameId, newUs, newThem, isFinished ? 'FINISHED' : 'IN_PROGRESS');
    if (isFinished) {
      setIsPlaying(false);
      setPhase('round-over');
      appendLog('¡PARTIDA FINALIZADA!');
    }
  };

  const handleStartMatch = async () => {
    appendLog('Conectando con el servidor...');
    const newGame = await createNewGame(userId);
    
    // Si la BD falla, generamos un ID temporal para que el frontend NO se bloquee
    const gameId = newGame?.id || Math.floor(Math.random() * 1000);
    
    if (!newGame) {
      appendLog('⚠️ Fallo en BD: Jugando en modo offline/local.');
    } else {
      appendLog(`[OK] Partida guardada. ¡Comienza el Mus!`);
    }

    setActiveGameId(gameId);
    setScore({ us: 0, them: 0 });
    setIsPlaying(true);
    setPhase('mus-check'); // Cambia la fase y activa el juego
  };

  const handleSimulateRound = async () => {
    if (!activeGameId) return;
    const newUs = Math.min(score.us + 2, CONST_MAX_SCORE);
    const newThem = Math.min(score.them + 1, CONST_MAX_SCORE);
    setScore({ us: newUs, them: newThem });
    appendLog(`Ronda terminada: Nosotros ${newUs} - Ellos ${newThem}.`);
    await persistGameState(newUs, newThem, activeGameId);
  };

  const handleUserMusDecision = (wantsMus: boolean) => {
    if (wantsMus) {
      setPhase('discarding');
      appendLog('Has pedido Mus. Esperando descartes...');
    } else {
      setPhase('betting');
      setStage('grande');
      appendLog('Has cortado el Mus. Vamos a las apuestas.');
    }
  };

  const handleExecuteDiscards = () => {
    setSelectedCards([]);
    setPhase('mus-check');
    appendLog('Cartas descartadas. Nueva ronda de hablar.');
  };

  const handleAdvanceStage = () => {
    if (stage === 'grande') setStage('chica');
    else if (stage === 'chica') setStage('pares');
    else if (stage === 'pares') setStage('juego');
    else {
      handleSimulateRound();
      setStage('grande');
      setPhase('init'); 
    }
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handleBetAction = (type: 'ENVIDO' | 'ORDAGO' | 'PASO') => {
    if (type === 'ORDAGO') {
      appendLog('¡ORDAGO! La partida se decide aquí (Ganas automáticamente en demo).');
      handleSimulateRound();
      setStage('grande');
      setPhase('init'); 
    } else if (type === 'ENVIDO') {
      appendLog('Envido 2 más (Aceptado por defecto en demo).');
      setScore(prev => ({ ...prev, us: prev.us + 2 }));
      handleAdvanceStage();
    } else {
      appendLog('He pasado.');
      handleAdvanceStage();
    }
  };

  return { 
    activeGameId, score, logs, isPlaying, phase, stage, selectedCards,
    handleStartMatch, handleSimulateRound, handleUserMusDecision, 
    handleExecuteDiscards, handleAdvanceStage, toggleCardSelection,
    handleBetAction
  };
};