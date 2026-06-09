import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TournamentDetails, MatchInfo } from '@/features/game/domain/lobby.types';

interface TournamentDetailModalProps {
  selectedTourneyId: number | null;
  tourneyDetails: TournamentDetails | null;
  loadingTourneyDetails: boolean;
  currentUserId: number;
  reportingMatchId: number | null;
  reportWinnerId: number | null;
  reportScore: string;
  secondsLeft: number | null;
  activeMatch?: MatchInfo;
  onClose: () => void;
  onJoin: () => void;
  onStart: () => void;
  onReadyUp: (matchId: number) => void;
  onCancelReady: (matchId: number) => void;
  onReportWinnerChange: (id: number | null) => void;
  onReportScoreChange: (score: string) => void;
  onReportingMatchIdChange: (id: number | null) => void;
  onReportSubmit: (e: React.FormEvent) => void;
  getTourneyUsernameById: (id: number | null) => string;
  formatTime: (seconds: number) => string;
}

const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({
  selectedTourneyId,
  tourneyDetails,
  loadingTourneyDetails,
  currentUserId,
  reportingMatchId,
  reportWinnerId,
  reportScore,
  secondsLeft,
  activeMatch,
  onClose,
  onJoin,
  onStart,
  onReadyUp,
  onCancelReady,
  onReportWinnerChange,
  onReportScoreChange,
  onReportingMatchIdChange,
  onReportSubmit,
  getTourneyUsernameById,
  formatTime,
}) => {
  const { t } = useTranslation();

  if (!selectedTourneyId || !tourneyDetails) return null;

  return (
    <div className="tourney-details-overlay">
      <div className="tourney-details-modal">
        {/* Close button */}
        <button
          onClick={onClose}
          className="tourney-details-close-btn"
        >
          ✕
        </button>

        {/* Header info */}
        <div className="tourney-details-header">
          <span className="tourney-details-subtitle">
            {t('premiumLobby.tournamentOnline')}
          </span>
          <h2 className="tourney-details-title">
            {tourneyDetails.tournament.title || tourneyDetails.tournament.tournamentName}
          </h2>
        </div>

        {loadingTourneyDetails ? (
          <div className="tourney-details-loader-box">
            <div className="lobby-loader tourney-details-loader-spinner"></div>
            <p className="tourney-details-loader-text">{t('premiumLobby.loadingLeaderboard')}</p>
          </div>
        ) : (
          <>
            {/* DETAILS GRID */}
            <div className="tourney-metrics-grid">
              <div className="tourney-metric-card">
                <span className="tourney-metric-label">{t('premiumLobby.registration')}</span>
                <span className="tourney-metric-value tourney-metric-value--fee">💰 {tourneyDetails.tournament.coinsFee || 0} tx</span>
              </div>
              <div className="tourney-metric-card">
                <span className="tourney-metric-label">{t('premiumLobby.championReward')}</span>
                <span className="tourney-metric-value tourney-metric-value--reward">🏆 {tourneyDetails.tournament.coinsReward || 0} tx</span>
              </div>
              <div className="tourney-metric-card">
                <span className="tourney-metric-label">{t('premiumLobby.capacity')}</span>
                <span className="tourney-metric-value">{tourneyDetails.participants.length} / {tourneyDetails.tournament.maxTeams || 8}</span>
              </div>
              <div className="tourney-metric-card">
                <span className="tourney-metric-label">{t('premiumLobby.status')}</span>
                <span className={`tourney-metric-value--status ${tourneyDetails.tournament.status === 'finished'
                    ? 'tourney-metric-value--status-finished'
                    : tourneyDetails.tournament.status === 'playing'
                      ? 'tourney-metric-value--status-playing'
                      : 'tourney-metric-value--status-open'
                  }`}>
                  {tourneyDetails.tournament.status === 'open' ? t('premiumLobby.open') : tourneyDetails.tournament.status === 'playing' ? t('premiumLobby.inGame') : t('premiumLobby.finished')}
                </span>
              </div>
            </div>

            {/* ACTION TRIGGERS (JOIN / START) */}
            {tourneyDetails.tournament.status === 'open' && (
              <div className="tourney-actions-row">
                {tourneyDetails.participants.some((p: any) => p.userId === currentUserId) ? (
                  <button className="tourney-btn-inscribed" disabled>
                    {t('premiumLobby.alreadyRegistered')}
                  </button>
                ) : (
                  <button className="btn-action tourney-btn-flex" onClick={onJoin}>
                    {t('premiumLobby.registerFor', { fee: tourneyDetails.tournament.coinsFee || 0 })}
                  </button>
                )}

                {tourneyDetails.tournament.organizerId === currentUserId && (
                  <button
                    className="btn-action tourney-btn-admin-start"
                    onClick={onStart}
                    disabled={tourneyDetails.participants.length < 2}
                  >
                    {t('premiumLobby.startTournamentAdmin')}
                  </button>
                )}
              </div>
            )}

            {/* REGISTERED PLAYERS (IF OPEN) */}
            {tourneyDetails.tournament.status === 'open' && (
              <div className="tourney-participants-section">
                <h3 className="tourney-section-heading">{t('premiumLobby.registeredParticipants')}</h3>
                {tourneyDetails.participants.length === 0 ? (
                  <p className="tourney-participants-empty">{t('premiumLobby.noRegistrations')}</p>
                ) : (
                  <div className="tourney-participants-list">
                    {tourneyDetails.participants.map((player: any) => (
                      <span key={player.userId} className={`tourney-participant-pill ${player.userId === currentUserId ? 'tourney-participant-pill--me' : ''}`}>
                        👤 {player.username} {player.userId === currentUserId && `(${t('premiumLobby.you')})`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------- VISUAL BRACKET TREE ---------- */}
            {(tourneyDetails.tournament.status === 'playing' || tourneyDetails.tournament.status === 'finished') && (
              <div>
                <h3 className="tourney-bracket-heading">{t('premiumLobby.tournamentBracket')}</h3>

                {activeMatch && (
                  <div className="active-match-card">
                    <h4 className="active-match-title">
                      ⚡ {t('premiumLobby.yourActiveMatch')}
                    </h4>
                    
                    <div className="active-match-players-row">
                      <div className="active-match-player">
                        <div className="player-team-member" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span className="player-name">
                            {getTourneyUsernameById(activeMatch.player1Id)}
                          </span>
                          <span className={`ready-badge ${activeMatch.player1Ready ? 'ready' : 'not-ready'}`}>
                            {activeMatch.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')}
                          </span>
                        </div>
                        {activeMatch.player1PartnerId && (
                          <div className="player-team-member" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <span className="player-name">
                              {getTourneyUsernameById(activeMatch.player1PartnerId)}
                            </span>
                            <span className={`ready-badge ${activeMatch.player1PartnerReady ? 'ready' : 'not-ready'}`}>
                              {activeMatch.player1PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="active-match-vs">VS</div>
                      
                      <div className="active-match-player">
                        <div className="player-team-member" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span className="player-name">
                            {getTourneyUsernameById(activeMatch.player2Id)}
                          </span>
                          <span className={`ready-badge ${activeMatch.player2Ready ? 'ready' : 'not-ready'}`}>
                            {activeMatch.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')}
                          </span>
                        </div>
                        {activeMatch.player2PartnerId && (
                          <div className="player-team-member" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <span className="player-name">
                              {getTourneyUsernameById(activeMatch.player2PartnerId)}
                            </span>
                            <span className={`ready-badge ${activeMatch.player2PartnerReady ? 'ready' : 'not-ready'}`}>
                              {activeMatch.player2PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {secondsLeft !== null && (
                      <div className="active-match-timer-box">
                        <div className="timer-countdown">
                          ⏱️ {formatTime(secondsLeft)}
                        </div>
                        <p className="timer-warning">
                          ⚠️ {t('premiumLobby.disqualificationWarning')}
                        </p>
                      </div>
                    )}

                    <div className="active-match-actions">
                      {activeMatch.gameRoomId ? (
                        <div className="redirecting-msg">
                          🔄 {t('premiumLobby.bothReadyRedirecting')}
                        </div>
                      ) : (
                        <>
                          {currentUserId === activeMatch.player1Id && (
                            activeMatch.player1Ready ? (
                              <button onClick={() => onCancelReady(activeMatch.matchId)} className="btn-action cancel-ready-btn" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.cancelReadyBtn')}
                              </button>
                            ) : (
                              <button onClick={() => onReadyUp(activeMatch.matchId)} className="btn-action ready-btn" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.readyBtn')}
                              </button>
                            )
                          )}

                          {currentUserId === activeMatch.player1PartnerId && (
                            activeMatch.player1PartnerReady ? (
                              <button onClick={() => onCancelReady(activeMatch.matchId)} className="btn-action cancel-ready-btn" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.cancelReadyBtn')}
                              </button>
                            ) : (
                              <button onClick={() => onReadyUp(activeMatch.matchId)} className="btn-action ready-btn" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.readyBtn')}
                              </button>
                            )
                          )}
                          
                          {currentUserId === activeMatch.player2Id && (
                            activeMatch.player2Ready ? (
                              <button onClick={() => onCancelReady(activeMatch.matchId)} className="btn-action cancel-ready-btn" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.cancelReadyBtn')}
                              </button>
                            ) : (
                              <button onClick={() => onReadyUp(activeMatch.matchId)} className="btn-action ready-btn" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.readyBtn')}
                              </button>
                            )
                          )}

                          {currentUserId === activeMatch.player2PartnerId && (
                            activeMatch.player2PartnerReady ? (
                              <button onClick={() => onCancelReady(activeMatch.matchId)} className="btn-action cancel-ready-btn" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.cancelReadyBtn')}
                              </button>
                            ) : (
                              <button onClick={() => onReadyUp(activeMatch.matchId)} className="btn-action ready-btn" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {t('premiumLobby.readyBtn')}
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="tourney-bracket-tree">

                  {/* ROUND 1: QUARTERFINALS */}
                  {tourneyDetails.matches.some((m: any) => m.roundNumber === 1) && (
                    <div className="bracket-round-column">
                      <span className="bracket-round-label">{t('premiumLobby.quarterfinals')}</span>
                      {tourneyDetails.matches.filter((m: any) => m.roundNumber === 1).map((match: any) => {
                        const isWinner1 = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player1PartnerId);
                        const isWinner2 = match.winnerId && (match.winnerId === match.player2Id || match.winnerId === match.player2PartnerId);
                        const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                        const isActive = !match.winnerId && match.player1Id && match.player2Id;

                        return (
                          <div key={match.matchId} className={`bracket-match-box ${reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                            <div className={`bracket-player-row ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {getTourneyUsernameById(match.player1Id)}
                                  {match.player1Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player1Ready ? 'ready' : 'not-ready'}`} title={match.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {match.player1PartnerId && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85em' }}>
                                    {getTourneyUsernameById(match.player1PartnerId)}
                                    {!match.winnerId && (
                                      <span className={`ready-indicator-dot ${match.player1PartnerReady ? 'ready' : 'not-ready'}`} title={match.player1PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                    )}
                                  </span>
                                )}
                              </div>
                              {isWinner1 && <span>✔</span>}
                            </div>
                            <div className="bracket-divider" />
                            <div className={`bracket-player-row ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {getTourneyUsernameById(match.player2Id)}
                                  {match.player2Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player2Ready ? 'ready' : 'not-ready'}`} title={match.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {match.player2PartnerId && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85em' }}>
                                    {getTourneyUsernameById(match.player2PartnerId)}
                                    {!match.winnerId && (
                                      <span className={`ready-indicator-dot ${match.player2PartnerReady ? 'ready' : 'not-ready'}`} title={match.player2PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                    )}
                                  </span>
                                )}
                              </div>
                              {isWinner2 && <span>✔</span>}
                            </div>
                            {match.score && (
                              <div className="bracket-score">{t('premiumLobby.result')} {match.score}</div>
                            )}
                            {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                              <button onClick={() => { onReportingMatchIdChange(match.matchId); onReportWinnerChange(match.player1Id); }} className="bracket-report-icon-btn" title={t("premiumLobby.reportWinnerTooltip")}>
                                ✎
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ROUND 2: SEMIFINALS */}
                  {tourneyDetails.matches.some((m: any) => m.roundNumber === 2) && (
                    <div className="bracket-round-column bracket-round-column--semis">
                      <span className="bracket-round-label">{t('premiumLobby.semifinals')}</span>
                      {tourneyDetails.matches.filter((m: any) => m.roundNumber === 2).map((match: any) => {
                        const isWinner1 = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player1PartnerId);
                        const isWinner2 = match.winnerId && (match.winnerId === match.player2Id || match.winnerId === match.player2PartnerId);
                        const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                        const isActive = !match.winnerId && match.player1Id && match.player2Id;

                        return (
                          <div key={match.matchId} className={`bracket-match-box ${reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                            <div className={`bracket-player-row ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {getTourneyUsernameById(match.player1Id)}
                                  {match.player1Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player1Ready ? 'ready' : 'not-ready'}`} title={match.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {match.player1PartnerId && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85em' }}>
                                    {getTourneyUsernameById(match.player1PartnerId)}
                                    {!match.winnerId && (
                                      <span className={`ready-indicator-dot ${match.player1PartnerReady ? 'ready' : 'not-ready'}`} title={match.player1PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                    )}
                                  </span>
                                )}
                              </div>
                              {isWinner1 && <span>✔</span>}
                            </div>
                            <div className="bracket-divider" />
                            <div className={`bracket-player-row ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {getTourneyUsernameById(match.player2Id)}
                                  {match.player2Id && !match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player2Ready ? 'ready' : 'not-ready'}`} title={match.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                                {match.player2PartnerId && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85em' }}>
                                    {getTourneyUsernameById(match.player2PartnerId)}
                                    {!match.winnerId && (
                                      <span className={`ready-indicator-dot ${match.player2PartnerReady ? 'ready' : 'not-ready'}`} title={match.player2PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                    )}
                                  </span>
                                )}
                              </div>
                              {isWinner2 && <span>✔</span>}
                            </div>
                            {match.score && (
                              <div className="bracket-score">{t('premiumLobby.result')} {match.score}</div>
                            )}
                            {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                              <button onClick={() => { onReportingMatchIdChange(match.matchId); onReportWinnerChange(match.player1Id); }} className="bracket-report-icon-btn" title={t("premiumLobby.reportWinnerTooltip")}>
                                ✎
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ROUND 3: GRAND FINAL */}
                  <div className="bracket-round-column bracket-round-column--final">
                    <span className="bracket-round-label">{t('premiumLobby.grandFinal')}</span>
                    {tourneyDetails.matches.filter((m: any) => m.roundNumber === 3).map((match: any) => {
                      const isWinner1 = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player1PartnerId);
                      const isWinner2 = match.winnerId && (match.winnerId === match.player2Id || match.winnerId === match.player2PartnerId);
                      const isOrganizer = tourneyDetails.tournament.organizerId === currentUserId;
                      const isActive = !match.winnerId && match.player1Id && match.player2Id;
                      const championId = match.winnerId;

                      return (
                        <div key={match.matchId} className={`bracket-match-box bracket-match-box--final ${championId ? 'bracket-match-box--championship' : reportingMatchId === match.matchId ? 'bracket-match-box--reporting' : ''}`}>
                          {championId && <span className="bracket-match-champion-tag">{t('premiumLobby.champion')}</span>}
                          <div className={`bracket-player-row bracket-player-row--final ${isWinner1 ? 'bracket-player-row--winner' : ''}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {getTourneyUsernameById(match.player1Id)}
                                {match.player1Id && !match.winnerId && (
                                  <span className={`ready-indicator-dot ${match.player1Ready ? 'ready' : 'not-ready'}`} title={match.player1Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                )}
                              </span>
                              {match.player1PartnerId && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85em' }}>
                                  {getTourneyUsernameById(match.player1PartnerId)}
                                  {!match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player1PartnerReady ? 'ready' : 'not-ready'}`} title={match.player1PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                              )}
                            </div>
                            {isWinner1 && <span>🏆</span>}
                          </div>
                          <div className="bracket-divider bracket-divider--final" />
                          <div className={`bracket-player-row bracket-player-row--final ${isWinner2 ? 'bracket-player-row--winner' : ''}`}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {getTourneyUsernameById(match.player2Id)}
                                {match.player2Id && !match.winnerId && (
                                  <span className={`ready-indicator-dot ${match.player2Ready ? 'ready' : 'not-ready'}`} title={match.player2Ready ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                )}
                              </span>
                              {match.player2PartnerId && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.8, fontSize: '0.85em' }}>
                                  {getTourneyUsernameById(match.player2PartnerId)}
                                  {!match.winnerId && (
                                    <span className={`ready-indicator-dot ${match.player2PartnerReady ? 'ready' : 'not-ready'}`} title={match.player2PartnerReady ? t('premiumLobby.playerReadyStatus') : t('premiumLobby.playerNotReadyStatus')} />
                                  )}
                                </span>
                              )}
                            </div>
                            {isWinner2 && <span>🏆</span>}
                          </div>
                          {match.score && (
                            <div className="bracket-score bracket-score--final">{t('premiumLobby.result')} {match.score}</div>
                          )}
                          {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                            <button onClick={() => { onReportingMatchIdChange(match.matchId); onReportWinnerChange(match.player1Id); }} className="bracket-report-icon-btn" title={t("premiumLobby.reportWinnerTooltip")}>
                              ✎
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* ---------- FLOATING REPORT SCORE PANEL ---------- */}
                {reportingMatchId && (
                  <form onSubmit={onReportSubmit} className="bracket-report-form">
                    <h4 className="bracket-report-form-title">{t('premiumLobby.reportResult')}</h4>

                    <div className="bracket-report-row">
                      <div className="bracket-report-field-group">
                        <label className="bracket-report-label">{t('premiumLobby.selectWinner')}</label>
                        <select
                          value={reportWinnerId || ''}
                          onChange={(e) => onReportWinnerChange(Number(e.target.value))}
                          className="bracket-report-select"
                        >
                          <option value="">{t('premiumLobby.selectOption')}</option>
                          {tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player1Id && (
                            <option value={tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player1Id || ''}>
                              {getTourneyUsernameById(tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player1Id || null)}
                            </option>
                          )}
                          {tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player2Id && (
                            <option value={tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player2Id || ''}>
                              {getTourneyUsernameById(tourneyDetails.matches.find((m: any) => m.matchId === reportingMatchId)?.player2Id || null)}
                            </option>
                          )}
                        </select>
                      </div>

                      <div className="bracket-report-field-group bracket-report-field-group--score">
                        <label className="bracket-report-label">{t('premiumLobby.score')}</label>
                        <input
                          type="text"
                          value={reportScore}
                          onChange={(e) => onReportScoreChange(e.target.value)}
                          placeholder={t("premiumLobby.scorePlaceholder")}
                          className="bracket-report-input"
                        />
                      </div>

                      <div className="bracket-report-actions">
                        <button type="submit" className="btn-action bracket-report-btn-save" disabled={!reportWinnerId}>
                          {t('premiumLobby.save')}
                        </button>
                        <button type="button" onClick={() => onReportingMatchIdChange(null)} className="bracket-report-btn-cancel">
                          {t('premiumLobby.cancel')}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default TournamentDetailModal;
