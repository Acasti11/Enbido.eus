import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminUsers from './components/AdminUsers';
import AdminTournaments from './components/AdminTournaments';
import AdminStats from './components/AdminStats';
import './AdminPage.css';

const AdminPage = (): React.JSX.Element => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'tournaments' | 'stats'>('users');

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="admin-page admin-page--loading">
        <div className="admin-loader"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <></>;
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">⚙️ Panel de Administración</h1>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
        <button
          className={`admin-tab ${activeTab === 'tournaments' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          🏆 Torneos
        </button>
        <button
          className={`admin-tab ${activeTab === 'stats' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Estadísticas
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'tournaments' && <AdminTournaments />}
        {activeTab === 'stats' && <AdminStats />}
      </div>
    </div>
  );
};

export default AdminPage;
