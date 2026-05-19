import React from 'react';
import Navbar from '../../components/layout/Navbar';
import GameScoreBoard from './components/GameScoreBoard';
import GameConsoleLogs from './components/GameConsoleLogs';
import ActionPanel from './components/ActionPanel';
import PlayerHand from './components/PlayerHand';
import { useMusGame } from './hooks/useMusGame';
import './mus-game.css';

const MusGamePage: React.FC = () => {
  // Extraemos el ID del usuario del localStorage, o usamos el 1 por defecto
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = savedUser.user_id || 1;

  const { 
    isPlaying, phase, stage, score, logs, selectedCards, speechBubbles, playerHand, botHands,
    handleStartMatch, startNewHand, handleUserMusDecision, handleExecuteDiscards, handleBetAction, toggleCardSelection 
  } = useMusGame(currentUserId);

  const handleActionPanelStart = () => {
    if (phase === 'round-over') {
      startNewHand();
    } else {
      handleStartMatch();
    }
  };

  const executeDiscardsLocal = () => {
    handleExecuteDiscards(selectedCards);
  };

  const handleBetLocal = (type: 'ENVIDO' | 'ORDAGO' | 'PASO') => {
    const actionMap = {
      'ENVIDO': 'Envido' as const,
      'ORDAGO': 'Ordago' as const,
      'PASO': 'Paso' as const
    };
    handleBetAction(actionMap[type]);
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
              <PlayerHand hand={isPlaying ? botHands[0] : []} isBot={phase !== 'round-over'} />
              {speechBubbles[2] && <div className="speech-bubble show">{speechBubbles[2]}</div>}
            </div>

            {/* JUGADOR OESTE (BOT) */}
            <div className="player-position position-west">
              <span className="player-info-tag">Bot Oeste</span>
              <PlayerHand hand={isPlaying ? botHands[1] : []} isBot={phase !== 'round-over'} />
              {speechBubbles[1] && <div className="speech-bubble show">{speechBubbles[1]}</div>}
            </div>

            {/* JUGADOR ESTE (BOT) */}
            <div className="player-position position-east">
              <span className="player-info-tag">Bot Este</span>
              <PlayerHand hand={isPlaying ? botHands[2] : []} isBot={phase !== 'round-over'} />
              {speechBubbles[3] && <div className="speech-bubble show">{speechBubbles[3]}</div>}
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
              {speechBubbles[0] && <div className="speech-bubble show">{speechBubbles[0]}</div>}
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
            onStart={handleActionPanelStart}
            onDecision={handleUserMusDecision}
            onDiscard={executeDiscardsLocal}
            onBet={handleBetLocal}
          />
        </aside>

      </div>
    </>
  );
};

export default MusGamePage;