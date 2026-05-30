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

interface TournamentDetails {
  tournament: any;
  participants: ParticipantInfo[];
}

import { useSeo } from '../../hooks/useSeo';

const TournamentPage = (): React.JSX.Element => {
  useSeo({
    title: 'Torneos de Mus Online y Presenciales - Brackets | Enbido',
    description: 'Participa en nuestros torneos de Mus online y presenciales en Euskadi. Consulta clasificaciones, brackets, reglas y gana grandes recompensas.',
    keywords: 'torneos de mus, txapelketa, competicion mus, mus online, enbido, brackets de mus',
    canonical: 'https://enbido.eus/torneos',
    ogImage: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=600&q=80',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Lista de Torneos de Mus - Enbido',
      'url': 'https://enbido.eus/torneos',
      'description': 'Torneos oficiales y populares de Mus en línea y presenciales en Euskadi.',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Torneo de Mus Enbido'
        }
      ]
    }
  });

  const [currentView, setCurrentView] = useState<string>(CONST_VIEW_LIST);
  const [tournamentsList, setTournamentsList] = useState<TournamentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ---------- DETAIL STATES ----------
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<TournamentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

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

      {/* ---------- DETAIL MODAL OVERLAY ---------- */}
      {selectedId && details && (
        <div className="modal-overlay" onClick={() => { setSelectedId(null); setDetails(null); }}>
          <div className="form-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh', overflowY: 'auto', background: 'radial-gradient(circle at top left, #121915, #080c0a)', border: '1px solid #d4af37', padding: '30px' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <span className="welcome-tag" style={{ color: '#d4af37' }}>DETALLES DEL TORNEO</span>
                <h2 className="welcome-title" style={{ fontSize: '24px', margin: '4px 0 0 0', color: '#fff' }}>{details.tournament.title}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>📍 {details.tournament.specificLocation}, {details.tournament.city}</p>
              </div>
              <button 
                onClick={() => { setSelectedId(null); setDetails(null); }}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </header>

            {loadingDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%' }}>
                <div className="lobby-loader" style={{ margin: '0 auto 15px auto' }}></div>
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Kargatzen / Cargando...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Left Side: Poster and info */}
                <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <img 
                    src={details.tournament.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'} 
                    alt={details.tournament.title}
                    style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  />
                </div>

                {/* Right Side: Information sheet */}
                <div style={{ flex: '2 2 380px', display: 'flex', flexDirection: 'column', gap: '20px', color: '#ddd' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#d4af37', fontSize: '1.1rem', borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '8px' }}>
                      📋 Ficha de Torneo Presencial
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                      <div>
                        <strong style={{ color: '#fff' }}>📍 Lugar:</strong>
                        <p style={{ margin: '4px 0 0 10px', color: '#aaa' }}>{details.tournament.specificLocation}, {details.tournament.city}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#fff' }}>🗓️ Fecha y Hora:</strong>
                        <p style={{ margin: '4px 0 0 10px', color: '#aaa' }}>
                          {details.tournament.startDatetime ? details.tournament.startDatetime.replace('T', ' a las ').substring(0, 16) : 'Por determinar'}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#fff' }}>📧 Email de Contacto:</strong>
                        <p style={{ margin: '4px 0 0 10px', color: '#aaa' }}>{details.tournament.organizer?.email || 'harreman@mus.eus'}</p>
                      </div>
                      <div>
                        <strong style={{ color: '#fff' }}>🏆 Premios y Trofeos:</strong>
                        <p style={{ margin: '4px 0 0 10px', color: '#aaa' }}>Txapela para la pareja ganadora + Premios locales del organizador.</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '0.95rem' }}>ℹ️ Descripción y Normativa</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.6' }}>
                      Este es un torneo de Mus presencial organizado por la comunidad. La inscripción, los pagos y el registro de partidas se realizarán directamente en el local de juego bajo la supervisión de los organizadores del torneo. Para más detalles sobre las bases del campeonato, por favor ponte en contacto a través del correo electrónico facilitado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentPage;