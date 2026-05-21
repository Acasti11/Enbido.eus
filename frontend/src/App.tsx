import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage/LoginPage';
import MeetupPage from './pages/MeetUp/MeetupPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import TournamentPage from './pages/TournamentPage/TournamentPage';
import ShopPage from './pages/ShopPage/ShopPage';
import MusGamePage from './pages/MusGamePage/MusGamePage';
import RankingPage from './pages/RankingPage/RankingPage';

// Definimos todas las páginas posibles
type PageView = 'login' | 'meetups' | 'profile' | 'tournaments' | 'shop' | 'mus' | 'ranking';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('login');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentPage('mus'); // <-- Al logear con éxito, te manda al MUS
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentPage('login');
  };

  return (
    <>
      <div style={{
        position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: 'rgba(15, 41, 30, 0.8)', padding: '12px',
        borderRadius: '12px', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ color: '#fff', fontSize: '10px', margin: '0 0 4px 0', textAlign: 'center', opacity: 0.7, textTransform: 'uppercase' }}>
          Navegador Test
        </p>
        
        <button onClick={() => setCurrentPage('login')} style={btnStyle(currentPage === 'login')}>
          🚪 Login
        </button>

        <button onClick={() => setCurrentPage('mus')} style={btnStyle(currentPage === 'mus')}>
          🃏 Mesa de Mus
        </button>

        <button onClick={() => setCurrentPage('meetups')} style={btnStyle(currentPage === 'meetups')}>
          🏘️ Meetups
        </button>

        <button onClick={() => setCurrentPage('tournaments')} style={btnStyle(currentPage === 'tournaments')}>
          🏆 Tournaments
        </button>

        <button onClick={() => setCurrentPage('shop')} style={btnStyle(currentPage === 'shop')}>
          🛍️ Shop
        </button>

        <button onClick={() => setCurrentPage('ranking')} style={btnStyle(currentPage === 'ranking')}>
          📊 Ranking
        </button>

        <button onClick={() => setCurrentPage('profile')} style={btnStyle(currentPage === 'profile')}>
          👤 Mi Perfil
        </button>

        {currentPage !== 'login' && (
          <button onClick={handleLogout} style={{...btnStyle(false), backgroundColor: '#e63946', marginTop: '4px'}}>
            Cerrar Sesión
          </button>
        )}
      </div>

      {/* RENDERIZADO DE LAS PÁGINAS */}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'meetups' && <MeetupPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'tournaments' && <TournamentPage />}
      {currentPage === 'shop' && <ShopPage />}
      {currentPage === 'mus' && <MusGamePage />}
      {currentPage === 'ranking' && <RankingPage />}
    </>
  );
}

// Helper para los estilos de los botones del menú de desarrollo
const btnStyle = (isActive: boolean) => ({
  padding: '8px 16px',
  backgroundColor: isActive ? '#d4af37' : 'rgba(255,255,255,0.1)',
  color: isActive ? '#0f291e' : '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' as const, transition: '0.2s'
});

export default App;