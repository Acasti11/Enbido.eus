import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MeetupAdCard, { type LocalMeetupAd } from './components/MeetupAdCard';
import CreateAdPage, { type CreateAdFormState } from './components/CreateAdPage';
import api from '../../services/api';
import './styles/meetup-page.css';
import './styles/meetup-map.css';

// Corregir imágenes de marcadores rotos en Leaflet con Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const MeetupPage: React.FC = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [ads, setAds] = useState<LocalMeetupAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [highlightedAdId, setHighlightedAdId] = useState<number | null>(null);

  // Obtener datos del usuario real autenticado
  const username = localStorage.getItem('username') || 'Tú (Jugador Actual)';

  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  const fetchMeetups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetups');
      const mapped = res.data.map((ad: any) => ({
        adId: ad.adId,
        creatorId: ad.creatorId,
        creatorName: ad.creator ? ad.creator.name : 'Usuario',
        location: ad.location,
        missingPlayers: ad.missingPlayers,
        description: ad.description,
        isActive: ad.isActive,
        latitude: ad.latitude,
        longitude: ad.longitude
      }));
      setAds(mapped);
    } catch (err) {
      console.error('Error fetching physical meetups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetups();
  }, []);

  // Efecto para inicializar y sincronizar el mapa Leaflet
  useEffect(() => {
    if (currentView !== 'list' || loading || ads.length === 0) return;

    // Evitar reinicializar el mapa sobre el mismo contenedor
    if (mapRef.current) return;

    // Coordenadas iniciales por defecto en el centro de Bilbao
    const centerLat = 43.2630;
    const centerLng = -2.9350;

    const map = L.map('meetup-map', {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Limpiar pines antiguos
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    // Añadir pins para cada quedada activa
    ads.forEach(ad => {
      // Si no tiene coordenadas (anuncios viejos), le asignamos una dispersa en Bilbao para que aparezcan
      const lat = ad.latitude || (43.2630 + (Math.random() - 0.5) * 0.04);
      const lng = ad.longitude || (-2.9350 + (Math.random() - 0.5) * 0.04);

      // Crear el popup content premium
      const popupDiv = document.createElement('div');
      popupDiv.className = 'map-popup-content';
      
      const titleEl = document.createElement('h4');
      titleEl.className = 'map-popup-title';
      titleEl.innerText = ad.location;
      
      const creatorEl = document.createElement('p');
      creatorEl.className = 'map-popup-text';
      creatorEl.innerHTML = `Organizado por: <strong>${ad.creatorName}</strong>`;

      const playersEl = document.createElement('span');
      playersEl.className = 'map-popup-badge';
      playersEl.innerText = ad.missingPlayers <= 0 ? 'Mesa Completa' : `Faltan ${ad.missingPlayers} jugadores`;

      const btnEl = document.createElement('button');
      btnEl.className = 'map-popup-action-btn';
      btnEl.innerText = 'Ver Anuncio / Unirse';
      btnEl.onclick = () => {
        const el = document.getElementById(`ad-card-${ad.adId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedAdId(ad.adId);
          setTimeout(() => {
            setHighlightedAdId(null);
          }, 2500);
        }
      };

      const chatBtn = document.createElement('button');
      chatBtn.className = 'map-popup-action-btn';
      chatBtn.style.marginTop = '6px';
      chatBtn.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
      chatBtn.style.color = '#fac715';
      chatBtn.style.border = '1px solid rgba(212, 175, 55, 0.4)';
      chatBtn.innerText = '💬 Escribir Privado';
      chatBtn.onclick = () => {
        if (!localStorage.getItem('token')) {
          alert('Debes iniciar sesión para contactar en privado');
          return;
        }
        const target = {
          id: ad.creatorId,
          username: ad.creatorName,
          elo: 1000 + Math.floor(Math.random() * 400),
          totalGamesPlayed: 15,
          totalGamesWon: 7
        };
        localStorage.setItem('enbido_open_dm_target', JSON.stringify(target));
        navigate('/jugar');
      };

      popupDiv.appendChild(titleEl);
      popupDiv.appendChild(creatorEl);
      popupDiv.appendChild(playersEl);
      popupDiv.appendChild(btnEl);
      popupDiv.appendChild(chatBtn);

      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(popupDiv);

      marker.on('click', () => {
        setHighlightedAdId(ad.adId);
      });

      markersRef.current.set(ad.adId, marker);
    });

    // Auto-ajustar la vista para encuadrar todos los marcadores si hay anuncios
    if (ads.length > 0) {
      const coords = ads.map(ad => {
        const lat = ad.latitude || 43.2630;
        const lng = ad.longitude || -2.9350;
        return [lat, lng] as [number, number];
      });
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ads, loading, currentView]);

  const handleCardClick = (ad: LocalMeetupAd) => {
    const lat = ad.latitude || 43.2630;
    const lng = ad.longitude || -2.9350;
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 14, { duration: 1.5 });
    }
    const marker = markersRef.current.get(ad.adId);
    if (marker) {
      marker.openPopup();
    }
    setHighlightedAdId(ad.adId);
  };

  const handleNavigateToCreate = (): void => setCurrentView('create');
  const handleNavigateToList = (): void => {
    setCurrentView('list');
    fetchMeetups();
  };

  const handleSaveNewAd = async (formData: CreateAdFormState): Promise<void> => {
    try {
      const payload = {
        location: formData.location,
        missingPlayers: Number(formData.missingPlayers),
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      const res = await api.post('/meetups', payload);
      const saved = res.data;

      const newAd: LocalMeetupAd = {
        adId: saved.adId,
        creatorId: saved.creatorId,
        creatorName: `${username} (Tú)`,
        location: saved.location,
        missingPlayers: saved.missingPlayers,
        description: saved.description,
        isActive: saved.isActive,
        latitude: saved.latitude,
        longitude: saved.longitude
      };
      
      setAds([newAd, ...ads]);
      handleNavigateToList();
    } catch (err) {
      console.error('Error saving meetup to DB:', err);
      alert('Inicia sesión para poder crear anuncios de quedadas');
    }
  };

  return (
    <div className="page-container">
      <main className="page-content">
        {loading ? (
          <div style={{ color: '#fff', textAlign: 'center', marginTop: '40px' }}>Kargatzen / Cargando...</div>
        ) : (
          <>
            {currentView === 'list' ? (
              <div>
                <header className="list-header">
                  <div>
                    <h1 className="list-title">Buscar Partida Física</h1>
                    <p className="list-subtitle">Encuentra mesas con huecos libres cerca de ti en Euskadi</p>
                  </div>
                  <button className="btn-create-main" onClick={handleNavigateToCreate}>
                    + Crear Anuncio
                  </button>
                </header>
                
                {/* DISEÑO DIVIDIDO CON MAPA Y TARJETAS */}
                <div className="meetup-split-layout">
                  {/* PANEL DEL MAPA INTERACTIVO */}
                  <div className="meetup-map-pane">
                    <div id="meetup-map" style={{ width: '100%', height: '100%' }}></div>
                  </div>

                  {/* PANEL DE LA LISTA DE QUEDADAS */}
                  <div className="meetup-list-pane">
                    {ads.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
                        No hay anuncios activos. ¡Sé el primero en crear uno!
                      </div>
                    ) : (
                      ads.map((ad) => (
                        <div 
                          key={ad.adId} 
                          onClick={() => handleCardClick(ad)}
                        >
                          <MeetupAdCard 
                            ad={ad} 
                            isHighlighted={highlightedAdId === ad.adId} 
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <CreateAdPage 
                onCancel={handleNavigateToList} 
                onSubmit={handleSaveNewAd} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MeetupPage;