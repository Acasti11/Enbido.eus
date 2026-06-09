import React, { useEffect, useState } from 'react';
import { api } from '@/shared/lib/api';

interface AdminTournamentDto {
  tournamentId: number;
  title: string;
  type?: string;
  status: string;
  city?: string;
  specificLocation?: string;
  startDatetime?: string;
  finishedAt?: string;
  maxTeams?: number;
  organizerId?: number;
  organizer?: { email?: string } | null;
}

const AdminTournaments = (): React.JSX.Element => {
  const [tournaments, setTournaments] = useState<AdminTournamentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'finished'>('all');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadTournaments();
    // Poll every 10 seconds to see auto-deletions in real-time
    const pollInterval = setInterval(loadTournaments, 10000);
    // Update countdown timer every second
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/tournaments');
      setTournaments(response.data);
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, type?: string) => {
    if (type !== 'ONLINE') {
      alert('Solo se pueden borrar torneos Online');
      return;
    }

    if (!window.confirm('¿Seguro que quieres borrar este torneo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/tournaments/${id}`);
      loadTournaments();
    } catch (err: unknown) {
      console.error('Error deleting tournament:', err);
      const axiosErr = err as { response?: { data?: { message?: string } | string } };
      const data = axiosErr?.response?.data;
      const msg = (typeof data === 'object' && data !== null && 'message' in data ? data.message : data) || 'Error al borrar torneo';
      alert(msg);
    }
  };

  const getTimeSinceFinished = (finishedAt?: string): string | null => {
    if (!finishedAt) return null;
    const finished = new Date(finishedAt);
    const diffMs = now - finished.getTime();
    if (diffMs < 0) return '0s';
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  };

  const getAutoDeleteCountdown = (finishedAt?: string): { text: string; urgent: boolean } | null => {
    if (!finishedAt) return null;
    const finished = new Date(finishedAt);
    const elapsedMs = now - finished.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;
    const remainingMs = fiveMinutesMs - elapsedMs;

    if (remainingMs <= 0) return { text: 'Borrando...', urgent: true };

    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    return { text: `${mins}m ${secs}s`, urgent: remainingMs < 60000 };
  };

  const formatDate = (datetime?: string): string => {
    if (!datetime) return '-';
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return datetime;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'online') return t.type === 'ONLINE';
    if (filter === 'finished') return t.status === 'finished';
    return true;
  });

  if (loading && tournaments.length === 0) {
    return (
      <div className="admin-section admin-section--loading">
        <div className="admin-loader"></div>
        <p>Cargando torneos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <p className="admin-error">{error}</p>
        <button className="btn-action" onClick={loadTournaments}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2>🏆 Gestión de Torneos</h2>
        <span className="admin-count">{filteredTournaments.length} torneos</span>
      </div>

      <div className="admin-filter-bar">
        <button
          className={`admin-filter-btn ${filter === 'all' ? 'admin-filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          className={`admin-filter-btn ${filter === 'online' ? 'admin-filter-btn--active' : ''}`}
          onClick={() => setFilter('online')}
        >
          🌐 Online
        </button>
        <button
          className={`admin-filter-btn ${filter === 'finished' ? 'admin-filter-btn--active' : ''}`}
          onClick={() => setFilter('finished')}
        >
          ✅ Finalizados
        </button>
      </div>

      <p className="admin-info-text">
        ℹ️ Los torneos Online finalizados se borran automáticamente 5 minutos después de terminar.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Fecha inicio</th>
              <th>Max</th>
              <th>Tiempo desde fin</th>
              <th>Borrado auto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTournaments.map((t) => {
              const isOnline = t.type === 'ONLINE';
              const isFinished = t.status === 'finished';
              const countdown = isFinished ? getAutoDeleteCountdown(t.finishedAt) : null;

              return (
                <tr
                  key={t.tournamentId}
                  className={isFinished ? 'row-finished' : ''}
                >
                  <td>{t.tournamentId}</td>
                  <td className="cell-title">{t.title}</td>
                  <td>
                    <span className={`type-badge ${isOnline ? 'type-badge--online' : 'type-badge--presencial'}`}>
                      {isOnline ? '🌐 Online' : '📍 Presencial'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${t.status}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{formatDate(t.startDatetime)}</td>
                  <td>{t.maxTeams || '-'}</td>
                  <td>
                    {isFinished && t.finishedAt ? (
                      <span className="countdown-elapsed">
                        {getTimeSinceFinished(t.finishedAt)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {countdown ? (
                      <span className={`countdown-timer ${countdown.urgent ? 'countdown-timer--urgent' : ''}`}>
                        {countdown.text}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {isOnline && (
                      <button
                        onClick={() => handleDelete(t.tournamentId, t.type)}
                        className="admin-btn admin-btn--delete"
                        title="Borrar torneo"
                      >
                        🗑️ Borrar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredTournaments.length === 0 && (
        <p className="admin-empty">No hay torneos para mostrar.</p>
      )}
    </div>
  );
};

export default AdminTournaments;
