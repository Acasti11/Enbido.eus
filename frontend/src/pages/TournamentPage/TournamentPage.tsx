import React, { useState, useEffect } from 'react';
import type { TournamentFormState, TournamentDto } from '../../types/tournament';
import { CONST_VIEW_LIST, CONST_VIEW_PUBLISH } from './constants';
import api from '../../services/api';

import TournamentList from './components/TournamentList';
import PublishForm from './components/PublishForm';
import './tournament.css';

interface ParticipantInfo {
  userId: number;
  username: string;
}

interface MatchInfo {
  matchId: number;
  tournamentId: number;
  roundNumber: number;
  matchIndex: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  score: string;
}

interface TournamentDetails {
  tournament: any;
  participants: ParticipantInfo[];
  matches: MatchInfo[];
}

const TournamentPage = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ---------- LEADERBOARD / DETAIL STATES ----------
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<TournamentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const currentUserId = Number(localStorage.getItem('userId') || '0');

  // Organizer reporting states
  const [reportingMatchId, setReportingMatchId] = useState<number | null>(null);
  const [reportWinnerId, setReportWinnerId] = useState<number | null>(null);
  const [reportScore, setReportScore] = useState<string>('3-0');

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tournaments');
      const mapped = res.data.map((t: any) => ({
        id: t.tournamentId,
        tournamentName: t.title,
        contactEmail: t.organizer?.email || 'harreman@mus.eus',
        tournamentLocation: t.specificLocation + (t.city ? `, ${t.city}` : ''),
        tournamentStructure: 'professional',
        tournamentDate: t.startDatetime ? t.startDatetime.split('T')[0] : '',
        tournamentTime: t.startDatetime ? t.startDatetime.split('T')[1]?.substring(0, 5) : '',
        maxParticipants: String(t.maxTeams || 64),
        inscriptionPrice: String(t.entryFee || 0),
        coinsFee: String(t.coinsFee || 0),
        coinsReward: String(t.coinsReward || 0),
        status: t.status,
        organizerId: t.organizerId,
        tournamentPrizes: `1º: Txapela + ${t.coinsReward || 0} tx`,
        otherDetails: t.status === 'open' ? 'Inscripciones abiertas' : t.status === 'playing' ? 'En juego' : 'Finalizado',
        posterImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80'
      }));
      setTournamentsList(mapped);
    } catch (err) {
      console.error('Error fetching tournaments from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleOpenDetail = async (id: number) => {
    setSelectedId(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/tournaments/${id}/details`);
      setDetails(res.data);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!selectedId) return;
    if (currentUserId === 0) {
      alert('Debes iniciar sesión para inscribirte en torneos.');
      return;
    }
    try {
      await api.post(`/tournaments/${selectedId}/join`);
      alert('¡Inscripción realizada con éxito!');
      handleOpenDetail(selectedId);
      fetchTournaments();
    } catch (err: any) {
      console.error('Error joining tournament:', err);
      alert(err.response?.data || 'Error al inscribirse. Comprueba tus monedas.');
    }
  };

  const handleStartTournament = async () => {
    if (!selectedId) return;
    try {
      await api.post(`/tournaments/${selectedId}/start`);
      alert('¡Torneo iniciado y brackets de eliminatorias generados!');
      handleOpenDetail(selectedId);
      fetchTournaments();
    } catch (err: any) {
      console.error('Error starting tournament:', err);
      alert(err.response?.data || 'Error al iniciar.');
    }
  };

  const handleReportWinnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reportingMatchId || !reportWinnerId) return;
    try {
      await api.post(`/tournaments/${selectedId}/matches/${reportingMatchId}/report`, null, {
        params: {
          winnerId: reportWinnerId,
          score: reportScore
        }
      });
      alert('Marcador reportado con éxito.');
      setReportingMatchId(null);
      setReportWinnerId(null);
      handleOpenDetail(selectedId);
      fetchTournaments();
    } catch (err: any) {
      console.error('Error reporting match score:', err);
      alert(err.response?.data || 'Error al reportar.');
    }
  };

  const handleSaveTournament = async (newTournamentData: TournamentFormState) => {
    try {
      const payload = {
        title: newTournamentData.tournamentName,
        city: newTournamentData.tournamentLocation.split(',')[1]?.trim() || '',
        specificLocation: newTournamentData.tournamentLocation.split(',')[0]?.trim() || newTournamentData.tournamentLocation,
        startDatetime: `${newTournamentData.tournamentDate}T${newTournamentData.tournamentTime || '12:00'}:00`,
        entryFee: Number(newTournamentData.inscriptionPrice || 0),
        coinsFee: Number(newTournamentData.coinsFee || 0),
        coinsReward: Number(newTournamentData.coinsReward || 0),
        maxTeams: Number(newTournamentData.maxParticipants || 8),
        status: 'open'
      };

      const res = await api.post('/tournaments', payload);
      const saved = res.data;
      
      const newTournament: TournamentDto = {
        id: saved.tournamentId,
        tournamentName: saved.title,
        contactEmail: saved.organizer?.email || newTournamentData.contactEmail || 'harreman@mus.eus',
        tournamentLocation: saved.specificLocation + (saved.city ? `, ${saved.city}` : ''),
        tournamentStructure: newTournamentData.tournamentStructure || 'professional',
        tournamentDate: saved.startDatetime ? saved.startDatetime.split('T')[0] : newTournamentData.tournamentDate,
        tournamentTime: saved.startDatetime ? saved.startDatetime.split('T')[1]?.substring(0, 5) : newTournamentData.tournamentTime,
        maxParticipants: String(saved.maxTeams || newTournamentData.maxParticipants),
        inscriptionPrice: String(saved.entryFee || newTournamentData.inscriptionPrice),
        coinsFee: String(saved.coinsFee || newTournamentData.coinsFee),
        coinsReward: String(saved.coinsReward || newTournamentData.coinsReward),
        status: saved.status,
        organizerId: saved.organizerId,
        tournamentPrizes: `1º: Txapela + ${saved.coinsReward || 0} tx`,
        otherDetails: 'Inscripciones abiertas',
        posterImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80'
      };

      setTournamentsList((prevList) => [newTournament, ...prevList]);
      setCurrentView(CONST_VIEW_LIST);
    } catch (err) {
      console.error('Error saving tournament to DB:', err);
      alert('Inicia sesión para poder publicar torneos');
    }
  };

  const getUsernameById = (id: number | null): string => {
    if (!id || !details) return 'Esperando...';
    const match = details.participants.find(p => p.userId === id);
    return match ? match.username : `Jugador-${id}`;
  };

  // Group matches for rendering
  const round1Matches = details?.matches.filter(m => m.roundNumber === 1) || [];
  const round2Matches = details?.matches.filter(m => m.roundNumber === 2) || [];
  const round3Matches = details?.matches.filter(m => m.roundNumber === 3) || [];
  const hasQuarterfinals = round1Matches.length > 0;

  return (
    <div className="tournament-app-wrapper">
      <main className="page-content">
        {loading ? (
          <div style={{ color: '#fff', textAlign: 'center', marginTop: '40px' }}>
            <div className="lobby-loader" style={{ margin: '0 auto 15px auto' }}></div>
            Kargatzen / Cargando...
          </div>
        ) : (
          <>
            {currentView === CONST_VIEW_LIST && (
              <TournamentList 
                tournaments={tournamentsList} 
                onPublish={() => setCurrentView(CONST_VIEW_PUBLISH)} 
                onClickDetail={handleOpenDetail}
              />
            )}
            {currentView === CONST_VIEW_PUBLISH && (
              <PublishForm 
                onAddTournament={handleSaveTournament} 
                onCancelPublish={() => setCurrentView(CONST_VIEW_LIST)} 
              />
            )}
          </>
        )}
      </main>

      {/* ---------- DETAIL & BRACKETS MODAL OVERLAY ---------- */}
      {selectedId && details && (
        <div className="modal-overlay" onClick={() => { setSelectedId(null); setDetails(null); setReportingMatchId(null); }}>
          <div className="form-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh', overflowY: 'auto', background: 'radial-gradient(circle at top left, #121915, #080c0a)', border: '1px solid #d4af37', padding: '30px' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <span className="welcome-tag" style={{ color: '#d4af37' }}>DETALLES DEL TORNEO</span>
                <h2 className="welcome-title" style={{ fontSize: '24px', margin: '4px 0 0 0', color: '#fff' }}>{details.tournament.title}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>📍 {details.tournament.specificLocation}, {details.tournament.city}</p>
              </div>
              <button 
                onClick={() => { setSelectedId(null); setDetails(null); setReportingMatchId(null); }}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </header>

            {loadingDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%' }}>
                <div className="lobby-loader" style={{ margin: '0 auto 15px auto' }}></div>
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Kargatzen / Cargando eliminatorias del torneo...</p>
              </div>
            ) : (
              <>
                {/* DETAILS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>INSCRIPCIÓN</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fac715' }}>💰 {details.tournament.coinsFee || 0} tx</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>RECOMPENSA CAMPEÓN</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>🏆 {details.tournament.coinsReward || 0} tx</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>AFORO</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{details.participants.length} / {details.tournament.maxTeams || 8}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>ESTADO</span>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: details.tournament.status === 'finished' ? '#4ade80' : details.tournament.status === 'playing' ? '#fac715' : '#aaa', textTransform: 'uppercase' }}>
                      {details.tournament.status === 'open' ? 'Abierto' : details.tournament.status === 'playing' ? 'En juego' : 'Finalizado'}
                    </span>
                  </div>
                </div>

                {/* ACTION TRIGGERS (JOIN / START) */}
                {details.tournament.status === 'open' && (
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
                    {details.participants.some(p => p.userId === currentUserId) ? (
                      <button className="btn-action" disabled style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#777', flex: 1, cursor: 'not-allowed', boxShadow: 'none' }}>
                        ✔ Ya estás inscrito en este torneo
                      </button>
                    ) : (
                      <button className="btn-action" onClick={handleJoinTournament} style={{ flex: 1 }}>
                        💰 Inscribirse por {details.tournament.coinsFee || 0} monedas (tx)
                      </button>
                    )}
                    
                    {details.tournament.organizerId === currentUserId && (
                      <button 
                        className="btn-action" 
                        onClick={handleStartTournament} 
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                        disabled={details.participants.length < 2}
                      >
                        ⚡ Iniciar Torneo y Generar Llaves
                      </button>
                    )}
                  </div>
                )}

                {/* REGISTERED PLAYERS (IF OPEN) */}
                {details.tournament.status === 'open' && (
                  <div style={{ marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Participantes Inscritos</h3>
                    {details.participants.length === 0 ? (
                      <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#6b7280' }}>Aún no hay inscripciones para este torneo presencial.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {details.participants.map((player) => (
                          <span key={player.userId} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: player.userId === currentUserId ? '#fac715' : '#fff', fontWeight: player.userId === currentUserId ? 'bold' : 'normal' }}>
                            👤 {player.username} {player.userId === currentUserId && '(Tú)'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ---------- VISUAL BRACKET TREE ---------- */}
                {(details.tournament.status === 'playing' || details.tournament.status === 'finished') && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Cuadro del Torneo / Brackets</h3>
                    
                    <div style={{ display: 'flex', gap: '30px', overflowX: 'auto', paddingBottom: '15px', minHeight: '320px', alignItems: 'center' }}>
                      
                      {/* ROUND 1: QUARTERFINALS */}
                      {hasQuarterfinals && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minWidth: '180px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textAlign: 'center', display: 'block', textTransform: 'uppercase', marginBottom: '5px' }}>Cuartos de Final</span>
                          {round1Matches.map((match) => {
                            const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                            const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                            const isOrganizer = details.tournament.organizerId === currentUserId;
                            const isActive = !match.winnerId && match.player1Id && match.player2Id;

                            return (
                              <div key={match.matchId} style={{ background: 'rgba(0,0,0,0.3)', border: reportingMatchId === match.matchId ? '1px solid #fac715' : '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner1 ? '#fac715' : '#fff', fontWeight: isWinner1 ? 'bold' : 'normal' }}>
                                  <span>{getUsernameById(match.player1Id)}</span>
                                  {isWinner1 && <span>✔</span>}
                                </div>
                                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', margin: '6px 0' }} />
                                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner2 ? '#fac715' : '#fff', fontWeight: isWinner2 ? 'bold' : 'normal' }}>
                                  <span>{getUsernameById(match.player2Id)}</span>
                                  {isWinner2 && <span>✔</span>}
                                </div>
                                {match.score && (
                                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px', textAlign: 'right' }}>Resultado: {match.score}</div>
                                )}
                                {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                  <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', background: '#fac715', color: '#000', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} title="Reportar Ganador">
                                    ✎
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ROUND 2: SEMIFINALS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', flex: 1, minWidth: '180px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textAlign: 'center', display: 'block', textTransform: 'uppercase', marginBottom: '5px' }}>Semifinales</span>
                        {round2Matches.map((match) => {
                          const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                          const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                          const isOrganizer = details.tournament.organizerId === currentUserId;
                          const isActive = !match.winnerId && match.player1Id && match.player2Id;

                          return (
                            <div key={match.matchId} style={{ background: 'rgba(0,0,0,0.3)', border: reportingMatchId === match.matchId ? '1px solid #fac715' : '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner1 ? '#fac715' : '#fff', fontWeight: isWinner1 ? 'bold' : 'normal' }}>
                                    <span>{getUsernameById(match.player1Id)}</span>
                                    {isWinner1 && <span>✔</span>}
                                  </div>
                                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', margin: '6px 0' }} />
                                  <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: isWinner2 ? '#fac715' : '#fff', fontWeight: isWinner2 ? 'bold' : 'normal' }}>
                                    <span>{getUsernameById(match.player2Id)}</span>
                                    {isWinner2 && <span>✔</span>}
                                  </div>
                                  {match.score && (
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px', textAlign: 'right' }}>Resultado: {match.score}</div>
                                  )}
                                  {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                    <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', background: '#fac715', color: '#000', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} title="Reportar Ganador">
                                      ✎
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* ROUND 3: GRAND FINAL */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', flex: 1, minWidth: '180px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textAlign: 'center', display: 'block', textTransform: 'uppercase', marginBottom: '5px' }}>Gran Final</span>
                            {round3Matches.map((match) => {
                              const isWinner1 = match.winnerId && match.winnerId === match.player1Id;
                              const isWinner2 = match.winnerId && match.winnerId === match.player2Id;
                              const isOrganizer = details.tournament.organizerId === currentUserId;
                              const isActive = !match.winnerId && match.player1Id && match.player2Id;
                              const championId = match.winnerId;

                              return (
                                <div key={match.matchId} style={{ background: 'rgba(212, 175, 55, 0.04)', border: championId ? '2px solid #fac715' : reportingMatchId === match.matchId ? '1px solid #fac715' : '1px solid rgba(255,255,255,0.15)', padding: '15px', borderRadius: '12px', position: 'relative', boxShadow: championId ? '0 0 15px rgba(250, 199, 21, 0.25)' : 'none' }}>
                                  {championId && <span style={{ fontSize: '16px', display: 'block', textAlign: 'center', marginBottom: '8px' }}>👑 ¡Campeón!</span>}
                                  <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', color: isWinner1 ? '#fac715' : '#fff', fontWeight: isWinner1 ? 'bold' : 'normal' }}>
                                    <span>{getUsernameById(match.player1Id)}</span>
                                    {isWinner1 && <span>🏆</span>}
                                  </div>
                                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }} />
                                  <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', color: isWinner2 ? '#fac715' : '#fff', fontWeight: isWinner2 ? 'bold' : 'normal' }}>
                                    <span>{getUsernameById(match.player2Id)}</span>
                                    {isWinner2 && <span>🏆</span>}
                                  </div>
                                  {match.score && (
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px', textAlign: 'right' }}>Resultado: {match.score}</div>
                                  )}
                                  {isOrganizer && isActive && reportingMatchId !== match.matchId && (
                                    <button onClick={() => { setReportingMatchId(match.matchId); setReportWinnerId(match.player1Id); }} style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', background: '#fac715', color: '#000', border: 'none', width: '22px', height: '22px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} title="Reportar Ganador">
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
                          <form onSubmit={handleReportWinnerSubmit} style={{ marginTop: '20px', background: 'rgba(250, 199, 21, 0.05)', border: '1px solid rgba(250, 199, 21, 0.25)', padding: '15px', borderRadius: '8px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#fac715', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✎ Registrar Resultado de Partida</h4>
                            
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>SELECCIONAR GANADOR</label>
                                <select 
                                  value={reportWinnerId || ''} 
                                  onChange={(e) => setReportWinnerId(Number(e.target.value))}
                                  style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem' }}
                                >
                                  <option value="">-- Seleccionar --</option>
                                  {details.matches.find(m => m.matchId === reportingMatchId)?.player1Id && (
                                    <option value={details.matches.find(m => m.matchId === reportingMatchId)?.player1Id || ''}>
                                      {getUsernameById(details.matches.find(m => m.matchId === reportingMatchId)?.player1Id || null)}
                                    </option>
                                  )}
                                  {details.matches.find(m => m.matchId === reportingMatchId)?.player2Id && (
                                    <option value={details.matches.find(m => m.matchId === reportingMatchId)?.player2Id || ''}>
                                      {getUsernameById(details.matches.find(m => m.matchId === reportingMatchId)?.player2Id || null)}
                                    </option>
                                  )}
                                </select>
                              </div>

                              <div style={{ width: '100px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>MARCADOR</label>
                                <input 
                                  type="text" 
                                  value={reportScore} 
                                  onChange={(e) => setReportScore(e.target.value)} 
                                  placeholder="3-0"
                                  style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="btn-action" style={{ padding: '8px 15px', fontSize: '0.8rem', boxShadow: 'none' }} disabled={!reportWinnerId}>
                                  Guardar
                                </button>
                                <button type="button" onClick={() => setReportingMatchId(null)} style={{ padding: '8px 15px', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                                  Cancelar
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
          )}

    </div>
  );
};

export default TournamentPage;