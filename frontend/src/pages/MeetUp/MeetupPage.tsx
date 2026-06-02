import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MeetupAdCard, { type LocalMeetupAd } from './components/MeetupAdCard';
import CreateAdPage, { type CreateAdFormState } from './components/CreateAdPage';
import api from '../../services/api';
import './styles/meetup-page.css';
import './styles/meetup-map.css';
import { useTranslation } from 'react-i18next';

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

import { useSeo } from '../../hooks/useSeo';

const MeetupPage: React.FC = (): React.JSX.Element => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useSeo({
    title: t('meetup.seoTitle'),
    description: t('meetup.seoDescription'),
    keywords: t('meetup.seoKeywords'),
    canonical: 'https://enbido.eus/quedadas',
    ogImage: 'https://enbido.eus/home-image-mus.png',
    lang: 'es',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': t('meetup.seoJsonLdName'),
      'url': 'https://enbido.eus/quedadas',
      'description': t('meetup.seoJsonLdDescription')
    }
  });

  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [ads, setAds] = useState<LocalMeetupAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [highlightedAdId, setHighlightedAdId] = useState<number | null>(null);

  // Filtros de búsqueda
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState<boolean>(false);
  const [filterOnlyMine, setFilterOnlyMine] = useState<boolean>(false);

  const currentUserId = Number(localStorage.getItem('userId') || '0');
  const username = localStorage.getItem('username') || t('meetup.currentUserFallback');

  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  const getEstablishmentIcon = (type: string | undefined) => {
    switch (type) {
      case 'TXOKO': return '🍽️';
      case 'CAFE': return '☕';
      case 'OUTDOOR': return '🌳';
      case 'BAR':
      default:
        return '🍻';
    }
  };

  const formatScheduledDate = (dateStr: string | undefined) => {
    if (!dateStr) return t('meetup.dateTBD');
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const fetchMeetups = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/meetups');
      const mapped = res.data.map((ad: any) => ({
        adId: ad.adId,
        creatorId: ad.creatorId,
        creatorName: ad.creator ? ad.creator.name : t('meetup.userFallback'),
        location: ad.location,
        missingPlayers: ad.missingPlayers,
        description: ad.description,
        isActive: ad.isActive,
        latitude: ad.latitude,
        longitude: ad.longitude,
        scheduledAt: ad.scheduledAt,
        establishmentType: ad.establishmentType
      }));
      setAds(mapped);
    } catch (err) {
      console.error(t('meetup.errorFetch'), err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetups(false);

    // Poll for physical meetups changes every 8 seconds
    const intervalId = setInterval(() => {
      fetchMeetups(true);
    }, 8000);

    return () => clearInterval(intervalId);
  }, []);

  // Filtrar los anuncios localmente
  const filteredAds = ads.filter(ad => {
    if (filterOnlyAvailable && ad.missingPlayers <= 0) return false;
    if (filterOnlyMine && ad.creatorId !== currentUserId) return false;
    return true;
  });

  // Generar icono personalizado de pin según estado
  const getMarkerIcon = (ad: LocalMeetupAd) => {
    const isCreator = ad.creatorId === currentUserId;
    const isFull = ad.missingPlayers <= 0;

    let pinColor = '#fac715'; // Dorado (Necesita jugadores)
    if (isCreator) {
      pinColor = '#3b82f6'; // Azul (Creada por ti)
    } else if (isFull) {
      pinColor = '#10B981'; // Verde (Mesa completa)
    }

    const html = `
      <div class="custom-map-pin" style="background-color: ${pinColor};">
        <span class="custom-map-pin-inner"></span>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-pin-container',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  };

  // Sincronizar el mapa Leaflet con los anuncios filtrados
  useEffect(() => {
    if (currentView !== 'list' || loading) return;

    // Crear el mapa si no existe
    if (!mapRef.current) {
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
    }

    // Limpiar pines antiguos
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const mapInstance = mapRef.current;

    // Añadir pins para cada quedada filtrada
    filteredAds.forEach(ad => {
      const lat = ad.latitude || (43.2630 + (Math.random() - 0.5) * 0.04);
      const lng = ad.longitude || (-2.9350 + (Math.random() - 0.5) * 0.04);

      // Crear el popup content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'map-popup-content';

      const titleEl = document.createElement('h4');
      titleEl.className = 'map-popup-title';
      titleEl.innerText = `${getEstablishmentIcon(ad.establishmentType)} ${ad.location}`;

      const dateEl = document.createElement('p');
      dateEl.className = 'map-popup-date';
      dateEl.innerHTML = `📅 <strong>${formatScheduledDate(ad.scheduledAt)}</strong>`;
      dateEl.style.margin = '4px 0';
      dateEl.style.fontSize = '0.85rem';
      dateEl.style.color = '#10B981';

      const creatorEl = document.createElement('p');
      creatorEl.className = 'map-popup-text';
      creatorEl.innerHTML = `${t('meetup.organizedBy', { name: ad.creatorName })}`;

      const playersEl = document.createElement('span');
      playersEl.className = 'map-popup-badge';
      playersEl.innerText = ad.missingPlayers <= 0 ? t('meetup.tableFull') : t('meetup.missingPlayers', { count: ad.missingPlayers });

      const btnEl = document.createElement('button');
      btnEl.className = 'map-popup-action-btn';
      btnEl.innerText = t('meetup.viewAndJoin');
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

      popupDiv.appendChild(titleEl);
      popupDiv.appendChild(dateEl);
      popupDiv.appendChild(creatorEl);
      popupDiv.appendChild(playersEl);
      popupDiv.appendChild(btnEl);

      const isAdCreator = ad.creatorId === currentUserId;
      if (!isAdCreator) {
        const chatBtn = document.createElement('button');
        chatBtn.className = 'map-popup-action-btn';
        chatBtn.style.marginTop = '6px';
        chatBtn.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
        chatBtn.style.color = '#fac715';
        chatBtn.style.border = '1px solid rgba(212, 175, 55, 0.4)';
        chatBtn.innerText = t('meetup.writePrivate');
        chatBtn.onclick = () => {
          if (!localStorage.getItem('token')) {
            alert(t('meetup.loginToContact'));
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
        popupDiv.appendChild(chatBtn);
      }

      if (ad.latitude && ad.longitude) {
        const mapsLink = document.createElement('a');
        mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${ad.latitude},${ad.longitude}`;
        mapsLink.target = '_blank';
        mapsLink.rel = 'noopener noreferrer';
        mapsLink.className = 'map-popup-link';
        mapsLink.innerText = t('meetup.howToGetThere');
        mapsLink.style.display = 'block';
        mapsLink.style.textAlign = 'center';
        mapsLink.style.marginTop = '8px';
        mapsLink.style.fontSize = '0.8rem';
        mapsLink.style.color = '#3b82f6';
        mapsLink.style.textDecoration = 'underline';
        popupDiv.appendChild(mapsLink);
      }

      const marker = L.marker([lat, lng], { icon: getMarkerIcon(ad) })
        .addTo(mapInstance)
        .bindPopup(popupDiv);

      marker.on('click', () => {
        setHighlightedAdId(ad.adId);
      });

      markersRef.current.set(ad.adId, marker);
    });

    // Auto-ajustar vista
    if (filteredAds.length > 0) {
      const coords = filteredAds.map(ad => {
        const lat = ad.latitude || 43.2630;
        const lng = ad.longitude || -2.9350;
        return [lat, lng] as [number, number];
      });
      const bounds = L.latLngBounds(coords);
      mapInstance.fitBounds(bounds, { padding: [40, 40] });
    }

  }, [filteredAds, loading, currentView]);

  // Limpieza al desmontar o cambiar vista
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentView]);

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
        longitude: formData.longitude,
        scheduledAt: formData.scheduledAt,
        establishmentType: formData.establishmentType
      };

      const res = await api.post('/meetups', payload);
      const saved = res.data;

      const newAd: LocalMeetupAd = {
        adId: saved.adId,
        creatorId: saved.creatorId,
        creatorName: `${username} (${t('meetup.you')})`,
        location: saved.location,
        missingPlayers: saved.missingPlayers,
        description: saved.description,
        isActive: saved.isActive,
        latitude: saved.latitude,
        longitude: saved.longitude,
        scheduledAt: saved.scheduledAt,
        establishmentType: saved.establishmentType
      };

      setAds([newAd, ...ads]);
      handleNavigateToList();
    } catch (err) {
      console.error(t('meetup.errorSave'), err);
      alert(t('meetup.loginToCreate'));
    }
  };

  const handleAdDeleted = (adId: number) => {
    setAds((prev) => prev.filter((ad) => ad.adId !== adId));
    const marker = markersRef.current.get(adId);
    if (marker) {
      marker.remove();
      markersRef.current.delete(adId);
    }
  };

  return (
    <div className="page-container">
      <main className="page-content">
        {loading ? (
          <div className="meetup-loading">{t('meetup.loading')}</div>
        ) : (
          <>
            {currentView === 'list' ? (
              <div>
                <header className="list-header">
                  <div>
                    <h1 className="list-title">{t('meetup.title')}</h1>
                    <p className="list-subtitle">{t('meetup.subtitle')}</p>
                  </div>
                  <button className="btn-create-main" onClick={handleNavigateToCreate}>
                    {t('meetup.createAd')}
                  </button>
                </header>

                {/* FILTROS RÁPIDOS */}
                <div className="meetup-filters-panel">
                  <span className="filters-label">{t('meetup.filters')}</span>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      className="filter-checkbox-input"
                      checked={filterOnlyAvailable} 
                      onChange={(e) => setFilterOnlyAvailable(e.target.checked)}
                    />
                    <span>{t('meetup.filterAvailable')}</span>
                  </label>
                  <label className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      className="filter-checkbox-input"
                      checked={filterOnlyMine} 
                      onChange={(e) => setFilterOnlyMine(e.target.checked)}
                    />
                    <span>{t('meetup.filterMine')}</span>
                  </label>
                </div>

                {/* DISEÑO DIVIDIDO CON MAPA Y TARJETAS */}
                <div className="meetup-split-layout">
                  {/* PANEL DEL MAPA INTERACTIVO */}
                  <div className="meetup-map-pane">
                    <div id="meetup-map" className="meetup-map" ></div>
                  </div>

                  {/* PANEL DE LA LISTA DE QUEDADAS */}
                  <div className="meetup-list-pane">
                    {filteredAds.length === 0 ? (
                      <div className="meetup-empty-state">
                        {t('meetup.empty')}
                      </div>
                    ) : (
                      filteredAds.map((ad) => (
                        <div 
                          key={ad.adId} 
                          onClick={() => handleCardClick(ad)}
                        >
                          <MeetupAdCard 
                            ad={ad} 
                            isHighlighted={highlightedAdId === ad.adId} 
                            onDelete={handleAdDeleted}
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