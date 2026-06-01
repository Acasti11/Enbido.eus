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
          <div className="tourney-list-loading-box">
            <div className="lobby-loader tourney-list-loading-spinner"></div>
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
          <div className="form-container tourney-detail-modal" onClick={(e) => e.stopPropagation()}>

            <header className="tourney-detail-header">
              <div>
                <span className="welcome-tag tourney-detail-tag">DETALLES DEL TORNEO</span>
                <h2 className="welcome-title tourney-detail-title">{details.tournament.title}</h2>
                <p className="tourney-detail-location">📍 {details.tournament.specificLocation}, {details.tournament.city}</p>
              </div>
              <button
                onClick={() => { setSelectedId(null); setDetails(null); }}
                className="tourney-detail-close-btn"
              >
                &times;
              </button>
            </header>

            {loadingDetails ? (
              <div className="tourney-detail-loading-box">
                <div className="lobby-loader tourney-list-loading-spinner"></div>
                <p className="tourney-detail-loading-text">Kargatzen / Cargando...</p>
              </div>
            ) : (
              <div className="tourney-detail-body">
                {/* Left Side: Poster and info */}
                <div className="tourney-detail-left">
                  <img
                    src={details.tournament.posterImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'}
                    alt={details.tournament.title}
                    className="tourney-detail-poster-img"
                  />
                </div>

                {/* Right Side: Information sheet */}
                <div className="tourney-detail-right">
                  <div className="tourney-detail-card">
                    <h3 className="tourney-detail-card-title">
                      📋 Ficha de Torneo Presencial
                    </h3>

                    <div className="tourney-detail-card-list">
                      <div>
                        <strong className="tourney-detail-label">📍 Lugar:</strong>
                        <p className="tourney-detail-value">{details.tournament.specificLocation}, {details.tournament.city}</p>
                      </div>
                      <div>
                        <strong className="tourney-detail-label">🗓️ Fecha y Hora:</strong>
                        <p className="tourney-detail-value">
                          {details.tournament.startDatetime ? details.tournament.startDatetime.replace('T', ' a las ').substring(0, 16) : 'Por determinar'}
                        </p>
                      </div>
                      <div>
                        <strong className="tourney-detail-label">📧 Email de Contacto:</strong>
                        <p className="tourney-detail-value">{details.tournament.organizer?.email || 'harreman@mus.eus'}</p>
                      </div>
                      <div>
                        <strong className="tourney-detail-label">🏆 Premios y Trofeos:</strong>
                        <p className="tourney-detail-value">Txapela para la pareja ganadora + Premios locales del organizador.</p>
                      </div>
                    </div>
                  </div>

                  <div className="tourney-detail-rules-card">
                    <h4 className="tourney-detail-rules-title">ℹ️ Descripción y Normativa</h4>
                    <p className="tourney-detail-rules-text">
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