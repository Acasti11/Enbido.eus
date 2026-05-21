import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import './tournament.css';

interface TournamentDto {
  tournamentId: number;
  title: string;
  city: string;
  specificLocation: string;
  startDatetime: string;
  entryFee: number;
  maxTeams: number;
  status: string;
  organizerId: number;
}

interface TournamentFormState {
  title: string;
  city: string;
  specificLocation: string;
  startDatetime: string;
  entryFee: number;
  maxTeams: number;
}

const emptyForm: TournamentFormState = {
  title: '',
  city: '',
  specificLocation: '',
  startDatetime: '',
  entryFee: 0,
  maxTeams: 8,
};

const STATUS_LABELS: Record<string, string> = {
  open: '🟢 Abierto',
  playing: '🟡 En Juego',
  finished: '🔴 Finalizado',
  cancelled: '⚪ Cancelado',
};

const TournamentPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TournamentFormState>(emptyForm);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).userId : 1;

    try {
      await api.post('/tournaments', {
        ...form,
        organizerId: userId,
      });
      await fetchTournaments();
      setShowForm(false);
      setForm(emptyForm);
    } catch (error) {
      console.error('Error creating tournament', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="page-container">
      <Navbar />
      <main className="tournament-page-content">
        <header className="tournament-header">
          <h1 className="tournament-title">Torneos Presenciales</h1>
          <p className="tournament-subtitle">Organiza y participa en torneos de Mus cerca de ti</p>
        </header>

        <div className="tournament-actions">
          <button className="create-tournament-btn" onClick={() => setShowForm(true)}>
            + Crear Torneo
          </button>
        </div>

        {loading ? (
          <div className="tournament-loading">Cargando torneos...</div>
        ) : tournaments.length === 0 ? (
          <div className="tournament-empty">No hay torneos disponibles. ¡Crea el primero!</div>
        ) : (
          <div className="tournament-grid">
            {tournaments.map(t => (
              <div key={t.tournamentId} className="tournament-card">
                <div className="tournament-card-title">{t.title}</div>
                <div className="tournament-card-info">
                  <span>📍 <strong>{t.city}</strong> — {t.specificLocation}</span>
                  <span>📅 {formatDate(t.startDatetime)}</span>
                  <span>👥 Máx. equipos: <strong>{t.maxTeams}</strong></span>
                  <span>💰 Inscripción: <strong>{t.entryFee > 0 ? `${t.entryFee}€` : 'Gratis'}</strong></span>
                </div>
                <span className={`tournament-status ${t.status}`}>
                  {STATUS_LABELS[t.status] || t.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Modal de crear torneo */}
        {showForm && (
          <div className="tournament-form-overlay" onClick={() => setShowForm(false)}>
            <form className="tournament-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h2>🏆 Nuevo Torneo</h2>

              <label>Nombre del torneo</label>
              <input type="text" required value={form.title}
                onChange={e => setForm({...form, title: e.target.value})} />

              <label>Ciudad</label>
              <input type="text" required value={form.city}
                onChange={e => setForm({...form, city: e.target.value})} />

              <label>Ubicación específica</label>
              <input type="text" required value={form.specificLocation}
                onChange={e => setForm({...form, specificLocation: e.target.value})} />

              <label>Fecha y hora de inicio</label>
              <input type="datetime-local" required value={form.startDatetime}
                onChange={e => setForm({...form, startDatetime: e.target.value})} />

              <label>Precio de inscripción (€)</label>
              <input type="number" min="0" step="0.5" value={form.entryFee}
                onChange={e => setForm({...form, entryFee: parseFloat(e.target.value)})} />

              <label>Máximo de equipos</label>
              <input type="number" min="2" max="64" value={form.maxTeams}
                onChange={e => setForm({...form, maxTeams: parseInt(e.target.value)})} />

              <div className="form-buttons">
                <button type="button" className="form-btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="form-btn-save">Crear Torneo</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentPage;