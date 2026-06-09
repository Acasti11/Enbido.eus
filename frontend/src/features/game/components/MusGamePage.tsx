import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import GameScoreBoard from './GameScoreBoard';
import GameConsoleLogs from './GameConsoleLogs';
import ActionPanel from './ActionPanel';

import PremiumLobby from './PremiumLobby';
import LobbyWaitingRoom from './LobbyWaitingRoom';
import { PlayerPosition } from './PlayerPosition';
import { OrientationOverlay } from './OrientationOverlay';
import { RoundTransitionOverlay } from './RoundTransitionOverlay';
import { useMusGame } from '../hooks/useMusGame';
import { useGameAudio } from '../hooks/useGameAudio';
import { useGameChat } from '../hooks/useGameChat';
import { useGameOver } from '../hooks/useGameOver';
import { useOrientation } from '../hooks/useOrientation';
import { useSeo } from '@/shared/hooks/useSeo';
import GameOverModal from '@/shared/components/layout/GameOverModal';
import './mus-game.css';
import { getSignEmojiOnly } from '../utils/signs';

const MusGamePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const currentUserId = user?.userId || 0;
  const username = user?.username || 'Jugador';

  useSeo({
    title: t('seo.gameTitle'),
    description: t('seo.gameDescription'),
    keywords: t('seo.gameKeywords'),
    canonical: 'https://enbido.eus/jugar',
    ogImage: 'https://enbido.eus/home-image-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      'name': t('seo.gameOgTitle'),
      'url': 'https://enbido.eus/jugar',
      'image': 'https://enbido.eus/home-image-mus.png',
      'description': t('seo.gameDescription'),
      'gamePlatform': t('seo.gamePlatform'),
      'numberOfPlayers': { '@type': 'QuantitativeValue', 'value': 4 }
    }
  });

  const {
    isPlaying, phase, stage, score, logs, chatMessages, selectedCards, speechBubbles, playerHand, botHands,
    roomId, seats, isSearching, queueSize, isMyTurn, betState,
    handleStartMatch, startNewHand, handleUserMusDecision, handleExecuteDiscards, handleBetAction, toggleCardSelection,
    onAddBot, onRemoveBot, onJoinRoom, onCreateRoom, onStartMatchmaking, onCancelMatchmaking, onLeaveRoom,
    reyesOption, maxRounds, updateRoomConfig, sendChatMessage, sendSign,
    activeSigns, turnDeadline, activeTurnIdx, dealerIdx,
    roundTransition, roundTransitionDeadline,
    leaveVotes, sendLeaveVote
  } = useMusGame(currentUserId);

  const { isPortraitOnMobile } = useOrientation();
  const { isMuted, toggleMute, timeLeft, isSignsOpen, setIsSignsOpen } = useGameAudio({
    isPlaying, isMyTurn, phase, turnDeadline, score
  });
  const { activeTab, setActiveTab, chatInput, setChatInput, chatEndRef, handleSendChat } = useGameChat({ sendChatMessage });
  const {
    isGameOverOpen, finalMatchData, eloChange, coinsChange, winningProfiles, isProfileLoading,
    handleCloseGameOver, handleLeaveGameOver
  } = useGameOver({
    isPlaying, roomId, score, maxRounds, seats, onLeaveRoom
  });

  const handleActionPanelStart = () => {
    if (phase === 'round-over') startNewHand();
    else handleStartMatch();
  };

  const handleTransitionComplete = () => {
    if (phase === 'round-over') startNewHand();
  };

  const executeDiscardsLocal = () => handleExecuteDiscards(selectedCards);

  const mySeat = seats.find(s => s.userId === currentUserId);
  const myChair = mySeat ? mySeat.chair : -1;
  const hasVotedToLeave = myChair !== -1 && leaveVotes.includes(myChair);

  const handleExitRequest = () => {
    if (!isPlaying) { onLeaveRoom(); return; }
    if (hasVotedToLeave) {
      if (window.confirm(t('musGame.cancelExitVoteConfirm') || '¿Quieres retirar tu voto de salida?')) {
        sendLeaveVote(false);
      }
    } else {
      if (window.confirm(t('musGame.voteExitConfirm') || 'Si sales de la partida en curso serás penalizado...')) {
        sendLeaveVote(true);
      }
    }
  };

  if (isAuthLoading || currentUserId === 0) {
    return (
      <div className="mus-game__loading">
        <div className="mus-game__spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

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
        {finalMatchData && (
          <GameOverModal
            isOpen={isGameOverOpen}
            onClose={handleCloseGameOver}
            onLeave={handleLeaveGameOver}
            roundsWonUs={finalMatchData.roundsWonUs}
            roundsWonThem={finalMatchData.roundsWonThem}
            maxRounds={finalMatchData.maxRounds}
            scoreUs={finalMatchData.scoreUs}
            scoreThem={finalMatchData.scoreThem}
            seats={finalMatchData.seats}
            eloChange={eloChange}
            coinsChange={coinsChange}
            winningProfiles={winningProfiles}
            isLoading={isProfileLoading}
          />
        )}
      </>
    );
  }

  if (!isPlaying) {
    return (
      <>
        <LobbyWaitingRoom
          roomId={roomId}
          seats={seats}
          currentUserId={currentUserId}
          onAddBot={onAddBot}
          onRemoveBot={onRemoveBot}
          onStartGame={handleStartMatch}
          onLeaveRoom={onLeaveRoom}
          reyesOption={reyesOption}
          maxRounds={maxRounds}
          onUpdateConfig={updateRoomConfig}
        />
        {finalMatchData && (
          <GameOverModal
            isOpen={isGameOverOpen}
            onClose={handleCloseGameOver}
            onLeave={handleLeaveGameOver}
            roundsWonUs={finalMatchData.roundsWonUs}
            roundsWonThem={finalMatchData.roundsWonThem}
            maxRounds={finalMatchData.maxRounds}
            scoreUs={finalMatchData.scoreUs}
            scoreThem={finalMatchData.scoreThem}
            seats={finalMatchData.seats}
            eloChange={eloChange}
            coinsChange={coinsChange}
            winningProfiles={winningProfiles}
            isLoading={isProfileLoading}
          />
        )}
      </>
    );
  }

  return (
    <>
      {isPortraitOnMobile && <OrientationOverlay lang={i18n.language} />}
      <div className="mus-view-container">
        <div className="felt-layout-pane">
          {leaveVotes.length > 0 && (
            <div className="friendly-exit-banner">
              <span>{t('musGame.friendlyExitBanner', { count: leaveVotes.length })}</span>
              <button
                className={`friendly-exit-btn-action ${hasVotedToLeave ? 'friendly-exit-btn-action--cancel' : ''}`}
                onClick={handleExitRequest}
              >
                {hasVotedToLeave ? t('musGame.cancelExitVote') : t('musGame.voteExit')}
              </button>
            </div>
          )}

          {roundTransition && phase === 'round-over' && (
            <RoundTransitionOverlay
              transition={roundTransition}
              deadline={roundTransitionDeadline}
              onComplete={handleTransitionComplete}
              t={t}
            />
          )}

          <div className="game-felt-board">
            <div className="felt-center-emblem">
              <h1 className="felt-logo">ENBIDO</h1>
              <span className="felt-sub">{t('musGame.musTable')}</span>
              <button className="leave-felt-btn" onClick={handleExitRequest}>
                {t('musGame.leaveTableShort')}
              </button>
            </div>

            {(['north', 'west', 'east', 'south'] as const).map((pos, idx) => (
              <PlayerPosition
                key={pos}
                position={pos}
                index={[2, 3, 1, 0][idx]}
                timeLeft={timeLeft}
                activeTurnIdx={activeTurnIdx}
                seats={seats}
                botHands={botHands}
                isPlaying={isPlaying}
                phase={phase}
                dealerIdx={dealerIdx}
                speechBubbles={speechBubbles}
                activeSigns={activeSigns}
                profile={null}
                playerHand={pos === 'south' ? playerHand : undefined}
                selectedCards={pos === 'south' ? selectedCards : undefined}
                toggleCardSelection={pos === 'south' ? toggleCardSelection : undefined}
                getSignEmojiOnly={getSignEmojiOnly}
                t={t}
                isSignsOpen={pos === 'south' ? isSignsOpen : undefined}
                setIsSignsOpen={pos === 'south' ? setIsSignsOpen : undefined}
                sendSign={pos === 'south' ? sendSign : undefined}
              />
            ))}
          </div>
        </div>

        <aside className="sidebar-panel">
          <GameScoreBoard score={score} maxRounds={maxRounds} />

          <div className="sound-toggle-container">
            <span className="sound-toggle-label">{t('musGame.gameSounds')}</span>
            <button
              onClick={toggleMute}
              className={`sound-toggle-btn ${isMuted ? 'sound-toggle-btn--muted' : 'sound-toggle-btn--active'}`}
            >
              {isMuted ? t('musGame.soundOff') : t('musGame.soundOn')}
            </button>
          </div>

          <div className="game-logs-widget">
            <div className="logs-header-tabs">
              <button onClick={() => setActiveTab('logs')} className={`logs-tab-btn ${activeTab === 'logs' ? 'logs-tab-btn--active' : ''}`}>
                {t('musGame.history')}
              </button>
              <button onClick={() => setActiveTab('chat')} className={`logs-tab-btn ${activeTab === 'chat' ? 'logs-tab-btn--active' : ''}`}>
                {t('musGame.tableChat')}
              </button>
            </div>

            {activeTab === 'logs' ? (
              <GameConsoleLogs logs={logs} />
            ) : (
              <div className="game-chat-tab-container">
                <div className="game-chat-messages-box" ref={chatEndRef}>
                  {chatMessages.length === 0 ? (
                    <div className="game-chat-empty-msg">{t('musGame.noMessages')}</div>
                  ) : (
                    chatMessages.map((msg: string, idx: number) => {
                      const parts = msg.split(': ');
                      const sender = parts[0];
                      const content = parts.slice(1).join(': ');
                      const isMe = sender.trim().toLowerCase() === username.trim().toLowerCase();
                      return (
                        <div key={idx} className={`game-chat-message ${isMe ? 'game-chat-message--me' : 'game-chat-message--other'}`}>
                          <strong className={`game-chat-message-sender ${isMe ? 'game-chat-message-sender--me' : ''}`}>{sender}</strong>
                          <span className="game-chat-message-content">{content}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSendChat} className="game-chat-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t('musGame.writeInTable')}
                    className="game-chat-input"
                  />
                  <button type="submit" className="game-chat-submit-btn">{t('musGame.send')}</button>
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
            onBet={(action) => handleBetAction(action)}
          />
        </aside>
      </div>

      {finalMatchData && (
        <GameOverModal
          isOpen={isGameOverOpen}
          onClose={handleCloseGameOver}
          onLeave={handleLeaveGameOver}
          roundsWonUs={finalMatchData.roundsWonUs}
          roundsWonThem={finalMatchData.roundsWonThem}
          maxRounds={finalMatchData.maxRounds}
          scoreUs={finalMatchData.scoreUs}
          scoreThem={finalMatchData.scoreThem}
          seats={finalMatchData.seats}
          eloChange={eloChange}
          coinsChange={coinsChange}
          winningProfiles={winningProfiles}
          isLoading={isProfileLoading}
        />
      )}
    </>
  );
};

export default MusGamePage;
