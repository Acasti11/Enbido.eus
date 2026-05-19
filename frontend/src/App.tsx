import { useState, useEffect } from 'react';
// IMPORTANTE: Aquí NO debe haber ningún "import './App.css'"
import LoginPage from './pages/LoginPage/LoginPage';
import MeetupPage from './pages/MeetUp/MeetupPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';

// Definimos las páginas posibles de tu app
type PageView = 'login' | 'meetups' | 'profile';

function App() {
  // Estado principal para controlar qué página se ve en pantalla
  const [currentPage, setCurrentPage] = useState<PageView>('login');

  // Al cargar la app, miramos si ya hay un usuario logueado en el LocalStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentPage('meetups'); // Si ya tiene sesión, lo mandamos directo a las partidas
    }
  }, []);

  // Función para cerrar sesión y volver a la pantalla de inicio
  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentPage('login');
  };

  return (
    <>
      {/* 🛠️ MENÚ DE DESARROLLO (Dev Tools) 🛠️
        He creado este menú flotante para que puedas navegar libremente
        entre tus 3 páginas y probar el diseño sin tener que hacer login cada vez.
      */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(15, 41, 30, 0.8)',
        padding: '12px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ color: '#fff', fontSize: '10px', margin: '0 0 4px 0', textAlign: 'center', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Navegador Test
        </p>
        
        <button 
          onClick={() => setCurrentPage('login')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 'login' ? '#d4af37' : 'rgba(255,255,255,0.1)',
            color: currentPage === 'login' ? '#0f291e' : '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s'
          }}
        >
          🚪 Login
        </button>

        <button 
          onClick={() => setCurrentPage('meetups')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 'meetups' ? '#d4af37' : 'rgba(255,255,255,0.1)',
            color: currentPage === 'meetups' ? '#0f291e' : '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s'
          }}
        >
          🏘️ Meetups
        </button>

        <button 
          onClick={() => setCurrentPage('profile')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 'profile' ? '#d4af37' : 'rgba(255,255,255,0.1)',
            color: currentPage === 'profile' ? '#0f291e' : '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s'
          }}
        >
          👤 Mi Perfil
        </button>

        {currentPage !== 'login' && (
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              marginTop: '4px',
              backgroundColor: '#e63946',
              color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Borrar Sesión
          </button>
        )}
      </div>

      {/* RENDERIZADO CONDICIONAL DE TUS PÁGINAS */}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'meetups' && <MeetupPage />}
      {currentPage === 'profile' && <ProfilePage />}
    </>
  );
}

export default App;