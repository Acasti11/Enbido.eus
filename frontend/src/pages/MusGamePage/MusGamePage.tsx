import React from 'react';
import Navbar from '../../components/layout/Navbar';
import GameScoreBoard from './components/GameScoreBoard';
import GameConsoleLogs from './components/GameConsoleLogs';
import ActionPanel from './components/ActionPanel';
import PlayerHand from './components/PlayerHand';
import PremiumLobby from './components/PremiumLobby';
import LobbyWaitingRoom from './components/LobbyWaitingRoom';
import { useMusGame } from './hooks/useMusGame';
import './mus-game.css';

const MusGamePage: React.FC = () => {
  // Extraemos el ID del usuario del localStorage, o usamos el 1 por defecto
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = savedUser.userId || savedUser.user_id || 1;

  const { 
    isPlaying, phase, stage, score, logs, selectedCards, speechBubbles, playerHand, botHands,
    roomId, seats, isSearching, queueSize, username, isMyTurn, betState, reyesMode, setReyesMode,
    handleStartMatch, startNewHand, handleUserMusDecision, handleExecuteDiscards, handleBetAction, toggleCardSelection,
    onAddBot, onJoinRoom, onCreateRoom, onStartMatchmaking, onCancelMatchmaking, onLeaveRoom
  } = useMusGame(currentUserId);

  const [equippedDeckId, setEquippedDeckId] = React.useState<number | undefined>(undefined);
  const [equippedTitleId, setEquippedTitleId] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    fetch(`http://localhost:8080/api/usuarios/${currentUserId}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setEquippedDeckId(data.equippedDeckItemId);
          setEquippedTitleId(data.equippedTitleItemId);
        }
      })
      .catch(console.error);
  }, [currentUserId]);

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

  const handleBetLocal = (action: 'Paso' | 'Envido' | 'Ordago' | 'Quiero' | 'No Quiero') => {
    handleBetAction(action);
  };

  // --- VISTA 1: LOBBY DE SELECCIÓN DE SALAS / APUESTAS ---
  if (roomId === '') {
    return (
      <>
        <Navbar />
        <PremiumLobby 
          userId={currentUserId}
          username={username}
          isSearching={isSearching}
          queueSize={queueSize}
          onJoinRoom={onJoinRoom}
          onCreateRoom={onCreateRoom}
          onStartMatchmaking={onStartMatchmaking}
          onCancelMatchmaking={onCancelMatchmaking}
          reyesMode={reyesMode}
          onReyesModeChange={setReyesMode}
        />
      </>
    );
  }

  // --- VISTA 2: SALA DE ESPERA / PRE-SEATS MESA ---
  if (!isPlaying) {
    return (
      <>
        <Navbar />
        <LobbyWaitingRoom 
          roomId={roomId}
          seats={seats}
          currentUserId={currentUserId}
          onAddBot={onAddBot}
          onStartGame={() => handleStartMatch()}
          onLeaveRoom={onLeaveRoom}
          reyesMode={reyesMode}
          onReyesModeChange={setReyesMode}
        />
      </>
    );
  }

  // --- VISTA 3: EL TAPETE VERDE DE JUEGO MULTIJUGADOR ---
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
              <button 
                className="leave-felt-btn" 
                onClick={onLeaveRoom} 
                style={{
                  marginTop: '10px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(220, 38, 38, 0.85)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.85)')}
              >
                🚪 Abandonar Mesa
              </button>
            </div>

            {/* JUGADOR NORTE (Mapeado dinámicamente) */}
            <div className="player-position position-north">
              <span className="player-info-tag">{seats[2]?.username || 'Bot Norte'}</span>
              <PlayerHand hand={isPlaying ? botHands[0] : []} isBot={phase !== 'round-over'} deckItemId={equippedDeckId} />
              {speechBubbles[2] && <div className="speech-bubble show">{speechBubbles[2]}</div>}
            </div>

            {/* JUGADOR OESTE (Mapeado dinámicamente) */}
            <div className="player-position position-west">
              <span className="player-info-tag">{seats[1]?.username || 'Bot Oeste'}</span>
              <PlayerHand hand={isPlaying ? botHands[1] : []} isBot={phase !== 'round-over'} deckItemId={equippedDeckId} />
              {speechBubbles[1] && <div className="speech-bubble show">{speechBubbles[1]}</div>}
            </div>

            {/* JUGADOR ESTE (Mapeado dinámicamente) */}
            <div className="player-position position-east">
              <span className="player-info-tag">{seats[3]?.username || 'Bot Este'}</span>
              <PlayerHand hand={isPlaying ? botHands[2] : []} isBot={phase !== 'round-over'} deckItemId={equippedDeckId} />
              {speechBubbles[3] && <div className="speech-bubble show">{speechBubbles[3]}</div>}
            </div>

            {/* TÚ (JUGADOR SUR - Silla relative 0) */}
            <div className="player-position position-south">
              <span className="player-info-tag current-player-tag">
                {seats[0]?.username || 'Tú'} ({equippedTitleId === 5 ? 'El Tímido' : equippedTitleId === 6 ? 'Maestro del Órdago' : 'Jugador'})
              </span>
              <PlayerHand 
                hand={isPlaying ? playerHand : []} 
                isBot={false} 
                isSelectable={phase === 'discarding'}
                selectedCards={selectedCards}
                onCardClick={toggleCardSelection}
                deckItemId={equippedDeckId}
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
            isMyTurn={isMyTurn}
            betState={betState}
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