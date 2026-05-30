import React, { useState, useEffect, useRef } from 'react';
import GameScoreBoard from './components/GameScoreBoard';
import GameConsoleLogs from './components/GameConsoleLogs';
import ActionPanel from './components/ActionPanel';
import PlayerHand from './components/PlayerHand';
import PremiumLobby from './components/PremiumLobby';
import LobbyWaitingRoom from './components/LobbyWaitingRoom';
import { useMusGame } from './hooks/useMusGame';
import api from '../../services/api';
import './styles/mus-game.css';

import { useSeo } from '../../hooks/useSeo';

const MusGamePage: React.FC = () => {
  useSeo({
    title: 'Jugar Mus Online - Partidas y Matchmaking | Enbido',
    description: 'Entra a jugar al Mus de forma gratuita en Enbido. Emparejamiento por ELO, salas privadas y juego contra bots avanzados.',
    keywords: 'jugar mus, mus online, emparejamiento mus, salas de mus, jugar mus online gratis',
    canonical: 'https://enbido.eus/jugar',
    ogImage: 'https://enbido.eus/hero-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      'name': 'Lobby de Mus - Enbido',
      'url': 'https://enbido.eus/jugar',
      'image': 'https://enbido.eus/hero-mus.png',
      'description': 'Entra a jugar al Mus de forma gratuita en Enbido. Emparejamiento por ELO, salas privadas y juego contra bots avanzados.',
      'gamePlatform': 'Web Browser',
      'numberOfPlayers': {
        '@type': 'QuantitativeValue',
        'value': 4
      }
    }
  });

  // Extraemos el ID del usuario del localStorage, o usamos el 1 por defecto
  const currentUserId = Number(localStorage.getItem('userId') || '1');

  // Cargar perfil para obtener equipamiento dinámico
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/usuarios/me/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Error fetching player profile for game felt:', err);
      }
    };
    fetchProfile();
  }, []);

  const { 
    isPlaying, phase, stage, score, logs, chatMessages, selectedCards, speechBubbles, playerHand, botHands,
    roomId, seats, isSearching, queueSize, username, isMyTurn, betState,
    handleStartMatch, startNewHand, handleUserMusDecision, handleExecuteDiscards, handleBetAction, toggleCardSelection,
    onAddBot, onJoinRoom, onCreateRoom, onStartMatchmaking, onCancelMatchmaking, onLeaveRoom,
    reyesOption, maxRounds, updateRoomConfig, sendChatMessage
  } = useMusGame(currentUserId);

  const [activeTab, setActiveTab] = useState<'logs' | 'chat'>('logs');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

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
        <PremiumLobby 
          username={username}
          isSearching={isSearching}
          queueSize={queueSize}
          onJoinRoom={onJoinRoom}
          onCreateRoom={onCreateRoom}
          onStartMatchmaking={onStartMatchmaking}
          onCancelMatchmaking={onCancelMatchmaking}
        />
      </>
    );
  }

  // --- VISTA 2: SALA DE ESPERA / PRE-SEATS MESA ---
  if (!isPlaying) {
    return (
      <>
        <LobbyWaitingRoom 
          roomId={roomId}
          seats={seats}
          currentUserId={currentUserId}
          onAddBot={onAddBot}
          onStartGame={handleStartMatch}
          onLeaveRoom={onLeaveRoom}
          reyesOption={reyesOption}
          maxRounds={maxRounds}
          onUpdateConfig={updateRoomConfig}
        />
      </>
    );
  }

  // --- VISTA 3: EL TAPETE VERDE DE JUEGO MULTIJUGADOR ---
  return (
    <>
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
              <PlayerHand hand={isPlaying ? botHands[0] : []} isBot={phase !== 'round-over'} equippedDeckItemId={profile?.equippedDeckItemId} />
              {speechBubbles[2] && <div className="speech-bubble show">{speechBubbles[2]}</div>}
            </div>

            {/* JUGADOR OESTE (Mapeado dinámicamente) */}
            <div className="player-position position-west">
              <span className="player-info-tag">{seats[1]?.username || 'Bot Oeste'}</span>
              <PlayerHand hand={isPlaying ? botHands[1] : []} isBot={phase !== 'round-over'} equippedDeckItemId={profile?.equippedDeckItemId} />
              {speechBubbles[1] && <div className="speech-bubble show">{speechBubbles[1]}</div>}
            </div>

            {/* JUGADOR ESTE (Mapeado dinámicamente) */}
            <div className="player-position position-east">
              <span className="player-info-tag">{seats[3]?.username || 'Bot Este'}</span>
              <PlayerHand hand={isPlaying ? botHands[2] : []} isBot={phase !== 'round-over'} equippedDeckItemId={profile?.equippedDeckItemId} />
              {speechBubbles[3] && <div className="speech-bubble show">{speechBubbles[3]}</div>}
            </div>

            {/* TÚ (JUGADOR SUR - Silla relative 0) */}
            <div className="player-position position-south">
              <span className={`player-info-tag current-player-tag ${profile?.equippedAvatarItemId === 1 ? 'avatar-ring-gold' : profile?.equippedAvatarItemId === 2 ? 'avatar-ring-green' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 12px' }}>
                <span style={{ fontWeight: 800 }}>{seats[0]?.username || 'Tú'} (Jugador)</span>
                {profile?.equippedTitleItemId === 5 && <span className="player-title-badge player-title-badge--green">HANDIA</span>}
                {profile?.equippedTitleItemId === 6 && <span className="player-title-badge player-title-badge--gold">ENBIDO MAISU</span>}
              </span>
              <PlayerHand 
                hand={isPlaying ? playerHand : []} 
                isBot={false} 
                isSelectable={phase === 'discarding'}
                selectedCards={selectedCards}
                onCardClick={toggleCardSelection}
                equippedDeckItemId={profile?.equippedDeckItemId}
              />
              {speechBubbles[0] && <div className="speech-bubble show">{speechBubbles[0]}</div>}
            </div>

          </div>
        </div>

        {/* PANEL DERECHO: CONTROLES Y MARCADOR */}
        <aside className="sidebar-panel">
          <GameScoreBoard score={score} maxRounds={maxRounds} />
          
          <div className="game-logs-widget">
            <div className="logs-header-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '10px' }}>
              <button 
                onClick={() => setActiveTab('logs')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: activeTab === 'logs' ? 'rgba(255, 255, 255, 0.05)' : 'none',
                  border: 'none',
                  color: activeTab === 'logs' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderBottom: activeTab === 'logs' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                📋 Historial
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: activeTab === 'chat' ? 'rgba(255, 255, 255, 0.05)' : 'none',
                  border: 'none',
                  color: activeTab === 'chat' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderBottom: activeTab === 'chat' ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                💬 Chat Mesa
              </button>
            </div>
            
            {activeTab === 'logs' ? (
              <GameConsoleLogs logs={logs} />
            ) : (
              <div className="game-chat-tab-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
                <div 
                  className="game-chat-messages-box" 
                  ref={chatEndRef}
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '8px 4px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    fontSize: '0.75rem',
                    background: '#000',
                    borderRadius: '8px',
                    border: '1px solid #222',
                    minHeight: '200px'
                  }}
                >
                  {chatMessages.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '30px', fontStyle: 'italic' }}>
                      No hay mensajes aún. ¡Di hola!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const parts = msg.split(': ');
                      const sender = parts[0];
                      const content = parts.slice(1).join(': ');
                      const isMe = sender === username;
                      
                      return (
                        <div key={idx} style={{ 
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: isMe ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          border: isMe ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          color: '#fff',
                          wordBreak: 'break-word',
                          animation: 'slideUp 0.2s ease-out'
                        }}>
                          <strong style={{ color: isMe ? '#60a5fa' : '#fbbf24', display: 'block', fontSize: '0.65rem', marginBottom: '2px' }}>
                            {sender}
                          </strong>
                          <span style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>{content}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <form 
                  onSubmit={handleSendChat}
                  style={{ 
                    display: 'flex', 
                    paddingTop: '8px',
                    gap: '6px'
                  }}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe en la mesa..."
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Enviar
                  </button>
                </form>
              </div>
            )}
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