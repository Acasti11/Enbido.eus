import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import GameScoreBoard from './components/GameScoreBoard';
import GameConsoleLogs from './components/GameConsoleLogs';
import ActionPanel from './components/ActionPanel';
import PlayerHand from './components/PlayerHand';
import { useMusGame } from './hooks/useMusGame';
import { createNewDeck, shuffleCardDeck } from './helpers/musEngineHelpers';
import type { CardItem } from '../../types/MusGame';
import './mus-game.css';

const MusGamePage: React.FC = () => {
  // Extraemos el ID del usuario del localStorage, o usamos el 1 por defecto
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = savedUser.user_id || 1;

  const [deck, setDeck] = useState<CardItem[]>([]);
  const [deckIndex, setDeckIndex] = useState(16);
  const [playerHand, setPlayerHand] = useState<CardItem[]>([]);
  const [botHands, setBotHands] = useState<CardItem[][]>([[], [], []]);
  
  const { 
    score, logs, isPlaying, phase, stage, selectedCards,
    handleStartMatch, handleUserMusDecision, handleExecuteDiscards, handleBetAction, toggleCardSelection 
  } = useMusGame(currentUserId);

  // Inicializar mazo
  useEffect(() => {
    const freshDeck = createNewDeck();
    const shuffled = shuffleCardDeck(freshDeck);
    setDeck(shuffled);
    setDeckIndex(16);
  }, [isPlaying]); // Se reinicia el mazo al empezar una nueva partida

  // Repartir cartas cuando la fase es 'mus-check'
  useEffect(() => {
    if (phase === 'mus-check' && deck.length >= 16 && playerHand.length === 0) {
      setPlayerHand(deck.slice(0, 4));
      setBotHands([deck.slice(4, 8), deck.slice(8, 12), deck.slice(12, 16)]);
      setDeckIndex(16);
    }
  }, [phase, deck, playerHand.length]);

  const executeDiscardsLocal = () => {
    if (selectedCards.length > 0) {
      const newCards = deck.slice(deckIndex, deckIndex + selectedCards.length);
      setDeckIndex(prev => prev + selectedCards.length);

      const updatedHand = playerHand.map(card => {
        if (selectedCards.includes(card.id)) {
          return newCards.shift() as CardItem;
        }
        return card;
      });
      setPlayerHand(updatedHand);
    }
    handleExecuteDiscards();
  };

  return (
    <>
      <Navbar />
      <div className="mus-view-container">
        
        {/* PANEL IZQUIERDO: LA MESA VERDE */}
        <div className="felt-layout-pane">
          <div className="game-felt-board">
            
            <div className="felt-center-emblem">
              <h1 className="felt-logo">ENBIDO</h1>
              <span className="felt-sub">Mesa de Mus</span>
            </div>

            {/* JUGADOR NORTE (BOT) */}
            <div className="player-position position-north">
              <span className="player-info-tag">Bot Norte</span>
              <PlayerHand hand={isPlaying ? botHands[0] : []} isBot={true} />
            </div>

            {/* JUGADOR OESTE (BOT) */}
            <div className="player-position position-west">
              <span className="player-info-tag">Bot Oeste</span>
              <PlayerHand hand={isPlaying ? botHands[1] : []} isBot={true} />
            </div>

            {/* JUGADOR ESTE (BOT) */}
            <div className="player-position position-east">
              <span className="player-info-tag">Bot Este</span>
              <PlayerHand hand={isPlaying ? botHands[2] : []} isBot={true} />
            </div>

            {/* TÚ (JUGADOR SUR) */}
            <div className="player-position position-south">
              <span className="player-info-tag current-player-tag">Tú (Jugador)</span>
              <PlayerHand 
                hand={isPlaying ? playerHand : []} 
                isBot={false} 
                isSelectable={phase === 'discarding'}
                selectedCards={selectedCards}
                onCardClick={toggleCardSelection}
              />
            </div>

          </div>
        </div>

        {/* PANEL DERECHO: CONTROLES Y MARCADOR */}
        <aside className="sidebar-panel">
          <GameScoreBoard score={score} />
          
          <div className="game-logs-widget">
            <div className="logs-header">HISTORIAL DE PARTIDA</div>
            <GameConsoleLogs logs={logs} />
          </div>

          <ActionPanel 
            phase={phase}
            stage={stage}
            selectedCount={selectedCards.length}
            onStart={handleStartMatch}
            onDecision={handleUserMusDecision}
            onDiscard={executeDiscardsLocal}
            onBet={handleBetAction}
          />
        </aside>

      </div>
    </>
  );
};

export default MusGamePage;