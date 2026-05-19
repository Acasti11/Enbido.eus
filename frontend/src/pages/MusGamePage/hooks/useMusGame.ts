import { useState, useCallback, useRef } from 'react';
import type { GameScore, LogEntry, GamePhase, BettingStage, CardItem } from '../../../types/MusGame';
import { useGameApi } from './useGameApi';
import { createNewDeck, shuffleCardDeck } from '../helpers/musEngineHelpers';

const CONST_MAX_SCORE = 30;

export const useMusGame = (userId: number) => {
  const { createNewGame, updateScore } = useGameApi();
  const activeGameIdRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [phase, setPhase] = useState<GamePhase>('init');
  const [stage, setStage] = useState<BettingStage>('grande');
  const [score, setScore] = useState<GameScore>({ us: 0, them: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<string[]>(['', '', '', '']); // [Tú, Oeste, Norte, Este]

  const [playerHand, setPlayerHand] = useState<CardItem[]>([]);
  const [botHands, setBotHands] = useState<CardItem[][]>([[], [], []]); // [Norte, Oeste, Este]

  // Refs para control de estado síncrono en bucles asíncronos
  const deckRef = useRef<CardItem[]>([]);
  const playersRef = useRef<CardItem[][]>([[], [], [], []]); // [Tú, Oeste, Norte, Este]
  const scoresRef = useRef<GameScore>({ us: 0, them: 0 });
  const phaseRef = useRef<GamePhase>('init');
  const stageRef = useRef<BettingStage>('grande');

  const apuestasRef = useRef<any>({
    grande: { ganadaPor: null, puntos: 0, deje: 0 },
    chica: { ganadaPor: null, puntos: 0, deje: 0 },
    pares: { apostado: false, ganadaPor: null, puntos: 0, deje: 0 },
    juego: { apostado: false, ganadaPor: null, puntos: 0, deje: 0, esPunto: false }
  });

  const pidiendoMusRef = useRef<number>(0);
  const currentBetPhaseRef = useRef<number>(0);

  const LANCES = ['GRANDE', 'CHICA', 'PARES', 'JUEGO'];

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [{ id: Math.random().toString(), message }, ...prev]);
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const showSpeechBubble = (playerIdx: number, text: string) => {
    setSpeechBubbles(prev => {
      const next = [...prev];
      next[playerIdx] = text;
      return next;
    });
    setTimeout(() => {
      setSpeechBubbles(prev => {
        const next = [...prev];
        if (next[playerIdx] === text) {
          next[playerIdx] = '';
        }
        return next;
      });
    }, 2000);
  };

  const syncHandsToState = () => {
    setPlayerHand([...playersRef.current[0]]);
    setBotHands([
      [...playersRef.current[2]], // Norte
      [...playersRef.current[1]], // Oeste
      [...playersRef.current[3]]  // Este
    ]);
  };

  // --- LÓGICA DE APUESTAS Y EVALUACIÓN (REGLAS DEL MUS) ---

  const getCardMusDetails = (card: CardItem) => {
    const number = card.rank;
    if (number === 3) return { display: '3', realOrder: 12, juegoValue: 10 }; // 3 es Rey
    if (number === 2) return { display: '2', realOrder: 1, juegoValue: 1 };   // 2 es As
    if (number === 1) return { display: '1', realOrder: 1, juegoValue: 1 };   // As
    if (number >= 10) return { display: number.toString(), realOrder: number, juegoValue: 10 }; // Figuras
    return { display: number.toString(), realOrder: number, juegoValue: number }; // Blancas
  };

  const getHandOrderedForGrande = (hand: CardItem[]) => {
    return [...hand].sort((a, b) => getCardMusDetails(b).realOrder - getCardMusDetails(a).realOrder);
  };

  const getHandOrderedForChica = (hand: CardItem[]) => {
    return [...hand].sort((a, b) => getCardMusDetails(a).realOrder - getCardMusDetails(b).realOrder);
  };

  const evaluatePares = (hand: CardItem[]) => {
    const counts: Record<number, number> = {};
    hand.forEach(c => {
      const order = getCardMusDetails(c).realOrder;
      counts[order] = (counts[order] || 0) + 1;
    });
    const frequencies = Object.values(counts).sort((a, b) => b - a);
    const keys = Object.keys(counts).map(Number);
    
    if (frequencies[0] === 4) return { has: true, type: 'Duples', value: 3, orderVal: getHandOrderedForGrande(hand)[0].rank };
    if (frequencies[0] === 3) return { has: true, type: 'Medias', value: 2, orderVal: getHandOrderedForGrande(hand)[0].rank };
    if (frequencies[0] === 2 && frequencies[1] === 2) return { has: true, type: 'Duples', value: 3, orderVal: getHandOrderedForGrande(hand)[0].rank };
    if (frequencies[0] === 2) {
      const pairRank = keys.find(k => counts[k] === 2) || 0;
      return { has: true, type: 'Par', value: 1, orderVal: pairRank };
    }
    return { has: false, type: 'Nada', value: 0, orderVal: 0 };
  };

  const evaluateJuego = (hand: CardItem[]) => {
    const sum = hand.reduce((acc, c) => acc + getCardMusDetails(c).juegoValue, 0);
    if (sum >= 31) {
      // 31 > 32 > 40 > 37 > 36 > 35 > 34 > 33
      const strength = sum === 31 ? 8 : (sum === 32 ? 7 : (sum === 40 ? 6 : sum - 30));
      return { hasJuego: true, sum: sum, strength: strength };
    }
    return { hasJuego: false, sum: sum, strength: sum }; // Para punto
  };

  // --- MOTOR DE PARTIDA ---

  const handleStartMatch = async () => {
    appendLog('Conectando con el servidor...');
    const newGame = await createNewGame(userId);
    const gameId = newGame?.id || Math.floor(Math.random() * 1000);
    activeGameIdRef.current = gameId;
    
    if (!newGame) {
      appendLog('⚠️ Fallo en BD: Jugando en modo offline/local.');
    } else {
      appendLog(`[OK] Partida guardada. ¡Comienza el Mus!`);
    }

    scoresRef.current = { us: 0, them: 0 };
    setScore({ us: 0, them: 0 });
    setIsPlaying(true);
    
    await startNewHand();
  };

  const startNewHand = async () => {
    apuestasRef.current = {
      grande: { ganadaPor: null, puntos: 0, deje: 0 },
      chica: { ganadaPor: null, puntos: 0, deje: 0 },
      pares: { apostado: false, ganadaPor: null, puntos: 0, deje: 0 },
      juego: { apostado: false, ganadaPor: null, puntos: 0, deje: 0, esPunto: false }
    };
    
    setLogs([]);
    appendLog('--- NUEVA MANO ---');
    setPhase('dealing');
    phaseRef.current = 'dealing';

    const freshDeck = createNewDeck();
    const shuffled = shuffleCardDeck(freshDeck);
    deckRef.current = shuffled;

    playersRef.current = [[], [], [], []];
    syncHandsToState();
    await sleep(800);

    appendLog('Repartiendo cartas...');
    for (let round = 0; round < 4; round++) {
      for (let p = 0; p < 4; p++) {
        const card = deckRef.current.pop();
        if (card) {
          playersRef.current[p].push(card);
        }
      }
    }
    syncHandsToState();
    await sleep(1000);

    await startMusPhase();
  };

  const startMusPhase = async () => {
    setPhase('mus-check');
    phaseRef.current = 'mus-check';
    pidiendoMusRef.current = 0;
    await askMusPlayer(0);
  };

  const askMusPlayer = async (playerIndex: number) => {
    if (playerIndex === 0) {
      // Espera interacción del usuario en ActionPanel
    } else {
      await sleep(1000);
      // IA del bot: 70% de probabilidades de pedir Mus
      const wantsMus = Math.random() > 0.3;
      await handleMusResponse(playerIndex, wantsMus);
    }
  };

  const handleMusResponse = async (playerIndex: number, wantsMus: boolean) => {
    showSpeechBubble(playerIndex, wantsMus ? '¡Mus!' : '¡No hay mus!');
    appendLog(`Bot ${playerIndex === 1 ? 'Oeste' : playerIndex === 2 ? 'Norte' : 'Este'} dice: ${wantsMus ? 'Mus' : 'Corto'}`);

    if (!wantsMus) {
      await sleep(1000);
      await startLances();
    } else {
      pidiendoMusRef.current++;
      if (pidiendoMusRef.current === 4) {
        await sleep(1000);
        startDiscardPhase();
      } else {
        await askMusPlayer(playerIndex + 1);
      }
    }
  };

  const handleUserMusDecision = async (wantsMus: boolean) => {
    showSpeechBubble(0, wantsMus ? '¡Mus!' : '¡Corto!');
    appendLog(`Tú dices: ${wantsMus ? 'Mus' : 'Corto'}`);

    if (!wantsMus) {
      await sleep(1000);
      await startLances();
    } else {
      pidiendoMusRef.current++;
      if (pidiendoMusRef.current === 4) {
        await sleep(1000);
        startDiscardPhase();
      } else {
        await askMusPlayer(1);
      }
    }
  };

  const startDiscardPhase = () => {
    setPhase('discarding');
    phaseRef.current = 'discarding';
  };

  const handleExecuteDiscards = async (selectedIds: string[]) => {
    // Descarte tuyo (playerIndex = 0)
    playersRef.current[0] = playersRef.current[0].filter(c => !selectedIds.includes(c.id));
    while (playersRef.current[0].length < 4) {
      const card = deckRef.current.pop();
      if (card) playersRef.current[0].push(card);
    }

    const descCount = selectedIds.length;
    showSpeechBubble(0, descCount === 0 ? '¡Servido!' : `Me doy ${descCount}`);
    appendLog(`Tú te descartas de ${descCount} cartas.`);
    syncHandsToState();
    setSelectedCards([]);

    // Descartes de los bots
    await executeBotDiscards(1);
  };

  const executeBotDiscards = async (playerIndex: number) => {
    if (playerIndex > 3) {
      await sleep(1000);
      await startMusPhase();
      return;
    }

    await sleep(1000);
    const botDiscards = Math.floor(Math.random() * 3) + 1;
    playersRef.current[playerIndex].splice(0, botDiscards);
    for (let j = 0; j < botDiscards; j++) {
      const card = deckRef.current.pop();
      if (card) playersRef.current[playerIndex].push(card);
    }

    showSpeechBubble(playerIndex, `Me doy ${botDiscards}`);
    appendLog(`Bot ${playerIndex === 1 ? 'Oeste' : playerIndex === 2 ? 'Norte' : 'Este'} se descarta de ${botDiscards} cartas.`);
    syncHandsToState();

    await executeBotDiscards(playerIndex + 1);
  };

  // --- LANCES (APUESTAS) ---

  const startLances = async () => {
    appendLog('--- COMIENZAN LAS APUESTAS ---');
    currentBetPhaseRef.current = 0;
    await playNextLance();
  };

  const playNextLance = async () => {
    if (currentBetPhaseRef.current >= LANCES.length) {
      await calculateFinalScores();
      return;
    }

    const lanceName = LANCES[currentBetPhaseRef.current];
    const bettingStage = lanceName.toLowerCase() as BettingStage;
    setStage(bettingStage);
    stageRef.current = bettingStage;

    setPhase('betting');
    phaseRef.current = 'betting';

    if (lanceName === 'PARES') {
      appendLog('-- Declaración de Pares --');
      const tienePares = [false, false, false, false];
      for (let i = 0; i < 4; i++) {
        tienePares[i] = evaluatePares(playersRef.current[i]).has;
        if (i !== 0) await sleep(600);
        showSpeechBubble(i, tienePares[i] ? '¡Pares sí!' : '¡Pares no!');
      }
      await sleep(1000);

      const equipoUs = tienePares[0] || tienePares[2];
      const equipoThem = tienePares[1] || tienePares[3];

      if (!equipoUs && !equipoThem) {
        appendLog('Nadie tiene pares. Siguiente lance.');
        currentBetPhaseRef.current++;
        await playNextLance();
        return;
      } else if (equipoUs && !equipoThem) {
        appendLog('Solo tu equipo tiene Pares.');
        apuestasRef.current.pares.ganadaPor = 'us';
        currentBetPhaseRef.current++;
        await playNextLance();
        return;
      } else if (!equipoUs && equipoThem) {
        appendLog('Solo el equipo rival tiene Pares.');
        apuestasRef.current.pares.ganadaPor = 'them';
        currentBetPhaseRef.current++;
        await playNextLance();
        return;
      }
    }

    if (lanceName === 'JUEGO') {
      appendLog('-- Declaración de Juego --');
      const tieneJuego = [false, false, false, false];
      for (let i = 0; i < 4; i++) {
        tieneJuego[i] = evaluateJuego(playersRef.current[i]).hasJuego;
        if (i !== 0) await sleep(600);
        showSpeechBubble(i, tieneJuego[i] ? '¡Juego sí!' : '¡Juego no!');
      }
      await sleep(1000);

      const equipoUs = tieneJuego[0] || tieneJuego[2];
      const equipoThem = tieneJuego[1] || tieneJuego[3];

      if (!equipoUs && !equipoThem) {
        appendLog('Nadie tiene Juego. ¡Se juega al PUNTO!');
        setStage('punto');
        stageRef.current = 'punto';
        apuestasRef.current.juego.esPunto = true;
      } else if (equipoUs && !equipoThem) {
        appendLog('Solo tu equipo tiene Juego.');
        apuestasRef.current.juego.ganadaPor = 'us';
        currentBetPhaseRef.current++;
        await playNextLance();
        return;
      } else if (!equipoUs && equipoThem) {
        appendLog('Solo el equipo rival tiene Juego.');
        apuestasRef.current.juego.ganadaPor = 'them';
        currentBetPhaseRef.current++;
        await playNextLance();
        return;
      }
    }

    await askBetPlayer(0, lanceName, 0);
  };

  const askBetPlayer = async (playerIndex: number, lance: string, apuestaActual: number) => {
    const key = apuestasRef.current.juego.esPunto && lance === 'JUEGO' ? 'juego' : lance.toLowerCase();

    if (playerIndex === 0) {
      // Activa botones del usuario
    } else {
      await sleep(1200);
      if (apuestaActual > 0) {
        const quiere = Math.random() > 0.5;
        if (quiere) {
          showSpeechBubble(playerIndex, '¡Quiero!');
          appendLog(`Rival quiere el envite de ${apuestaActual} a la ${lance}.`);
          apuestasRef.current[key].puntos = apuestaActual;
        } else {
          showSpeechBubble(playerIndex, '¡No quiero!');
          appendLog(`Rival NO quiere a la ${lance}. Te llevas 1 de deje.`);
          apuestasRef.current[key].deje = 1;
          apuestasRef.current[key].ganadaPor = 'us';
        }
      } else {
        showSpeechBubble(playerIndex, '¡Paso!');
        appendLog(`Rival Pasa a la ${lance}.`);
        apuestasRef.current[key].puntos = 1;
      }

      await sleep(1500);
      currentBetPhaseRef.current++;
      await playNextLance();
    }
  };

  const handleBetAction = async (action: 'Paso' | 'Envido' | 'Ordago') => {
    const lanceName = LANCES[currentBetPhaseRef.current];
    const key = apuestasRef.current.juego.esPunto && lanceName === 'JUEGO' ? 'juego' : lanceName.toLowerCase();

    showSpeechBubble(0, action === 'Paso' ? '¡Paso!' : action === 'Envido' ? '¡Envido!' : '¡ÓRDAGO!');

    if (action === 'Paso') {
      appendLog(`Tú pasas a la ${lanceName}`);
      await askBetPlayer(1, lanceName, 0);
    } else if (action === 'Envido') {
      appendLog(`Tú envidas 2 a la ${lanceName}`);
      await askBetPlayer(1, lanceName, 2);
    } else if (action === 'Ordago') {
      appendLog(`¡ÓRDAGO A LA ${lanceName}!`);
      appendLog('El rival no quiere el Órdago (Simulado). Te llevas 1 punto.');
      apuestasRef.current[key].deje = 1;
      apuestasRef.current[key].ganadaPor = 'us';
      currentBetPhaseRef.current++;
      await playNextLance();
    }
  };

  const calculateFinalScores = async () => {
    setPhase('round-over');
    phaseRef.current = 'round-over';

    appendLog('--- RECUENTO FINAL DE CARTAS ---');
    await sleep(2000);

    const myGrande = getHandOrderedForGrande(playersRef.current[0])[0].rank;
    const rivalGrande = getHandOrderedForGrande(playersRef.current[1])[0].rank;
    if (!apuestasRef.current.grande.ganadaPor) {
      apuestasRef.current.grande.ganadaPor = (myGrande >= rivalGrande) ? 'us' : 'them';
    }

    const myChica = getHandOrderedForChica(playersRef.current[0])[0].rank;
    const rivalChica = getHandOrderedForChica(playersRef.current[1])[0].rank;
    if (!apuestasRef.current.chica.ganadaPor) {
      apuestasRef.current.chica.ganadaPor = (myChica <= rivalChica) ? 'us' : 'them';
    }

    let tempUs = 0;
    let tempThem = 0;

    Object.keys(apuestasRef.current).forEach(k => {
      const lance = apuestasRef.current[k];
      if (lance.ganadaPor === 'us') {
        tempUs += lance.deje > 0 ? lance.deje : (lance.puntos === 0 ? 1 : lance.puntos);
      } else if (lance.ganadaPor === 'them') {
        tempThem += lance.deje > 0 ? lance.deje : (lance.puntos === 0 ? 1 : lance.puntos);
      }
    });

    const misPares = evaluatePares(playersRef.current[0]);
    if (misPares.has) {
      appendLog(`Tienes ${misPares.type}. +${misPares.value} extra.`);
      tempUs += misPares.value;
    }

    const miJuego = evaluateJuego(playersRef.current[0]);
    if (miJuego.hasJuego && !apuestasRef.current.juego.esPunto) {
      const premio = miJuego.sum === 31 ? 3 : 2;
      appendLog(`Tienes Juego de ${miJuego.sum}. +${premio} extra.`);
      tempUs += premio;
    } else if (apuestasRef.current.juego.esPunto && apuestasRef.current.juego.ganadaPor === 'us') {
      appendLog(`Ganas el Punto con ${miJuego.sum}. +1 extra.`);
      tempUs += 1;
    }

    const newUs = Math.min(scoresRef.current.us + tempUs, CONST_MAX_SCORE);
    const newThem = Math.min(scoresRef.current.them + tempThem, CONST_MAX_SCORE);

    scoresRef.current = { us: newUs, them: newThem };
    setScore({ us: newUs, them: newThem });

    appendLog(`Puntos ganados -> Nosotros: ${tempUs} | Ellos: ${tempThem}`);

    if (activeGameIdRef.current) {
      const isFinished = newUs >= CONST_MAX_SCORE || newThem >= CONST_MAX_SCORE;
      await updateScore(activeGameIdRef.current, newUs, newThem, isFinished ? 'FINISHED' : 'IN_PROGRESS');
    }

    if (newUs >= CONST_MAX_SCORE) {
      appendLog('¡ENHORABUENA! HABÉIS GANADO LA PARTIDA DE MUS.');
      setIsPlaying(false);
    } else if (newThem >= CONST_MAX_SCORE) {
      appendLog('Han ganado los rivales. Más suerte en la próxima.');
      setIsPlaying(false);
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
    selectedCards,
    speechBubbles,
    playerHand,
    botHands,
    handleStartMatch,
    startNewHand,
    handleUserMusDecision,
    handleExecuteDiscards,
    handleBetAction,
    toggleCardSelection
  };
};