import React, { useEffect, useState } from 'react';
import { api } from '@/shared/lib/api';

interface AdminUserDto {
  userId: number;
  username: string;
  email: string;
  name: string;
  surname?: string;
  role: string;
  isBanned: boolean;
  createdAt?: string;
}

const AdminUsers = (): React.JSX.Element => {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/usuarios');
      setUsers(response.data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios. ¿Tienes permisos de admin?');
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (userId: number, currentBanStatus: boolean) => {
    try {
      if (currentBanStatus) {
        await api.post(`/usuarios/${userId}/unban`);
      } else {
        await api.post(`/usuarios/${userId}/ban`);
      }
      loadUsers();
    } catch (err) {
      console.error('Error toggling ban:', err);
      alert('Error al actualizar el estado del usuario');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-section admin-section--loading">
        <div className="admin-loader"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <p className="admin-error">{error}</p>
        <button className="btn-action" onClick={loadUsers}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h2>👥 Gestión de Usuarios</h2>
        <span className="admin-count">{filteredUsers.length} usuarios</span>
      </div>

      <input
        type="text"
        placeholder="Buscar por username, email o nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="admin-search-input"
      />

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.userId} className={user.isBanned ? 'row-banned' : ''}>
                <td>{user.userId}</td>
                <td className="cell-username">{user.username}</td>
                <td>{user.email}</td>
                <td>{user.name} {user.surname || ''}</td>
                <td>
                  <span className={`role-badge role-badge--${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isBanned ? 'status-badge--banned' : 'status-badge--active'}`}>
                    {user.isBanned ? '🔴 Baneado' : '🟢 Activo'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleBan(user.userId, user.isBanned)}
                    className={`admin-btn ${user.isBanned ? 'admin-btn--unban' : 'admin-btn--ban'}`}
                  >
                    {user.isBanned ? 'Desbanear' : 'Banear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <p className="admin-empty">No se encontraron usuarios</p>
      )}
    </div>
  );
};

export default AdminUsers;
