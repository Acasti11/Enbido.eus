import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

// ========== SVGS COMO COMPONENTES DE ICONOS ==========

const PlayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const TrophyIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v3.34a6 6 0 0 1-6 5.66 6 6 0 0 1-6-5.66V8a6 6 0 0 1 6-6Z" />
  </svg>
);

const MapPinIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ShopBagIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CardsIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="14" rx="2" ry="2" transform="rotate(-10 9 13)" />
    <rect x="6" y="4" width="14" height="14" rx="2" ry="2" transform="rotate(5 13 11)" />
  </svg>
);

const HomePage: React.FC = (): React.JSX.Element => {
  const navigate = useNavigate();

  // Estadísticas dinámicas del juego para simular un servidor activo (estilo chess.com)
  const [onlinePlayers, setOnlinePlayers] = useState(1482);
  const [gamesToday, setGamesToday] = useState(3841);

  useEffect(() => {
    // Variación pequeña de jugadores en línea cada 4 segundos
    const interval = setInterval(() => {
      setOnlinePlayers((prev) => {
        const change = Math.floor(Math.random() * 11) - 5; // -5 a +5
        return Math.max(1400, prev + change);
      });
      setGamesToday((prev) => prev + Math.floor(Math.random() * 2));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      {/* SECCIÓN HERO - DISEÑO DIVIDIDO */}
      <section className="home-hero-section">
        {/* Columna Izquierda: Visualización premium de una mesa de Mus */}
        <div className="home-visual-pane">
          <img 
            src="/hero-mus.png" 
            alt="Mesa de juego de Mus premium de Enbido.eus con tapete verde y baraja española" 
            className="home-hero-img" 
          />
          <div className="home-visual-overlay">
            <div className="home-visual-tagline">
              🏆 ENBIDO MAISUAREN ETXEA 🏆
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Acción Estilo Chess.com */}
        <div className="home-cta-pane">
          <h1 className="home-title">
            Jokatu Musean Online
            <span>Juega al Mus en la Mayor Comunidad</span>
          </h1>
          
          <p className="home-subtitle">
            Euskal Herriko muslaririk onenen aurka jokatu edo lagunekin mahaia sortu. 
            Compite contra los mejores jugadores o crea una mesa privada para tus amigos.
          </p>

          {/* Estadísticas de Actividad En Vivo */}
          <div className="home-stats-bar" aria-label="Estadísticas de juego en vivo">
            <div className="home-stat-item">
              <span className="home-stat-number">
                <span className="home-stat-pulse" />
                {onlinePlayers.toLocaleString()}
              </span>
              <span className="home-stat-label">Linean / En línea</span>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-number">
                {gamesToday.toLocaleString()}
              </span>
              <span className="home-stat-label">Partidak gaur / Partidas hoy</span>
            </div>
          </div>

          {/* Botones de Navegación Directa */}
          <div className="home-buttons-box">
            <button 
              className="btn-play-primary" 
              onClick={() => navigate('/jugar')}
              title="Entrar al tapete de juego en línea"
            >
              <PlayIcon />
              Jokatu Orain / Jugar Ahora
            </button>

            <button 
              className="btn-tournaments-secondary" 
              onClick={() => navigate('/torneos')}
              title="Ver el tablón de torneos"
            >
              <TrophyIcon />
              Torneotara Bat Egin / Unirse a Torneos
            </button>

            <button 
              className="btn-meetups-outline" 
              onClick={() => navigate('/quedadas')}
              title="Ver mapa interactivo de quedadas"
            >
              <MapPinIcon />
              Quedadak Aurkitu / Buscar Quedadas
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN GRID DE CARACTERÍSTICAS */}
      <section className="home-features-section" aria-label="Características de Enbido">
        
        {/* Tarjeta de Jugar */}
        <div className="home-feature-card" onClick={() => navigate('/jugar')}>
          <div className="home-feature-icon">
            <CardsIcon />
          </div>
          <h2 className="home-feature-title">Jolastu / Jugar</h2>
          <p className="home-feature-desc">
            Sartu lobby publikoetan, jokatu lagunen aurka gela pribatuetan edo entrenatu adimen artifizialeko bot-en kontra.
            Entra en salas públicas, juega contra amigos o practica contra nuestros bots inteligentes.
          </p>
        </div>

        {/* Tarjeta de Torneos */}
        <div className="home-feature-card" onClick={() => navigate('/torneos')}>
          <div className="home-feature-icon">
            <TrophyIcon />
          </div>
          <h2 className="home-feature-title">Torneoak / Torneos</h2>
          <p className="home-feature-desc">
            Lehiatu txapelketa ofizial zein herrikoietan. Irabazi txapela eta igo rankingeko sailkapenean muslaririk handiena izateko.
            Compite en torneos presenciales u online. Gana la txapela y sube en el ranking para demostrar quién es el mejor.
          </p>
        </div>

        {/* Tarjeta de Quedadas */}
        <div className="home-feature-card" onClick={() => navigate('/quedadas')}>
          <div className="home-feature-icon">
            <MapPinIcon />
          </div>
          <h2 className="home-feature-title">Quedadak / Quedadas</h2>
          <p className="home-feature-desc">
            Bilatu zure herri edo hiritik hurbil dauden joko-mahai fisikoak gure mapa interaktiboan eta osatu laukotea.
            Encuentra mesas físicas cerca de ti en nuestro mapa interactivo y completa la partida con otros jugadores locales.
          </p>
        </div>

      </section>

      {/* SECCIÓN ANUNCIO TIENDA */}
      <section className="home-shop-banner">
        <div className="home-shop-text">
          <span className="home-shop-badge">Pertsonalizazioa / Personalización</span>
          <h2 className="home-shop-title">Zure estiloa mahaian erakutsi / Muestra tu estilo en la mesa</h2>
          <p className="home-shop-desc">
            Erosi txanponekin tapete pertsonalizatuak, kartetako atzealde bereziak, avatar bikainak eta titulu ospetsuak (Adib. "ENBIDO MAISU").
            Consigue tapetes personalizados, reversos de cartas temáticos, avatares exclusivos y títulos prestigiosos para destacar en la mesa.
          </p>
        </div>
        <div className="home-shop-action">
          <button 
            className="btn-shop-accent"
            onClick={() => navigate('/tienda')}
            title="Ir a la tienda de Enbido"
          >
            <ShopBagIcon />
            Tiendara Joan / Ir a la Tienda
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Enbido.eus. Eskubide guztiak erreserbatuta / Todos los derechos reservados.</p>
        <div className="home-footer-links">
          <span className="home-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/jugar')}>Mus Arauak / Reglas</span>
          <span className="home-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/torneos')}>Txapelketak / Campeonatos</span>
          <span className="home-footer-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/quedadas')}>Mapak / Mapas</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
