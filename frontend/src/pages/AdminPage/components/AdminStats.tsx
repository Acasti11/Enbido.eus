import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';

interface StatsState {
  totalUsers: number;
  totalTournaments: number;
  totalGames: number;
  bannedUsers: number;
  onlineTournaments: number;
  presencialTournaments: number;
  loading: boolean;
  error: string;
}

const AdminStats = (): React.JSX.Element => {
  const [stats, setStats] = useState<StatsState>({
    totalUsers: 0,
    totalTournaments: 0,
    totalGames: 0,
    bannedUsers: 0,
    onlineTournaments: 0,
    presencialTournaments: 0,
    loading: true,
    error: '',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, tournamentsRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/tournaments'),
      ]);

      const users = usersRes.data as Array<{ isBanned?: boolean; role?: string }>;
      const tournaments = tournamentsRes.data as Array<{ type?: string; status?: string }>;

      setStats({
        totalUsers: users.length,
        totalTournaments: tournaments.length,
        totalGames: 0,
        bannedUsers: users.filter((u) => u.isBanned).length,
        onlineTournaments: tournaments.filter((t) => t.type === 'ONLINE').length,
        presencialTournaments: tournaments.filter((t) => t.type !== 'ONLINE').length,
        loading: false,
        error: '',
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats((prev) => ({ ...prev, loading: false, error: 'Error al cargar estadísticas' }));
    }
  };

  if (stats.loading) {
    return (
      <div className="admin-section admin-section--loading">
        <div className="admin-loader"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="admin-section">
        <p className="admin-error">{stats.error}</p>
        <button className="btn-action" onClick={loadStats}>Reintentar</button>
      </div>
    );
  }

  const statCards = [
    { label: '👥 Usuarios Totales', value: stats.totalUsers, color: '#4ade80' },
    { label: '🏆 Torneos Totales', value: stats.totalTournaments, color: '#60a5fa' },
    { label: '🌐 Torneos Online', value: stats.onlineTournaments, color: '#a78bfa' },
    { label: '📍 Torneos Presenciales', value: stats.presencialTournaments, color: '#fbbf24' },
    { label: '🔴 Usuarios Baneados', value: stats.bannedUsers, color: '#f87171' },
  ];

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2>📊 Estadísticas</h2>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card" style={{ borderTopColor: card.color }}>
            <h2 className="stat-card__label">{card.label}</h2>
            <p className="stat-card__value" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminStats;
