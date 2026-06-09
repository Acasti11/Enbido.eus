import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { type LocalMeetupAd } from '@/features/meetup/types/MeetupTypes';
import { getEstablishmentIcon, formatScheduledDate } from '@/features/meetup/utils/meetupFormatters';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface UseMeetupMapProps {
  filteredAds: LocalMeetupAd[];
  loading: boolean;
  currentView: string;
  currentUserId: number;
  isAuthenticated: boolean;
  setHighlightedAdId: (id: number | null) => void;
}

interface UseMeetupMapReturn {
  mapRef: React.MutableRefObject<L.Map | null>;
  markersRef: React.MutableRefObject<Map<number, L.Marker>>;
  handleCardClick: (ad: LocalMeetupAd) => void;
}

const getMarkerIcon = (ad: LocalMeetupAd, currentUserId: number): L.DivIcon => {
  const isCreator = ad.creatorId === currentUserId;
  const isFull = ad.missingPlayers <= 0;

  let pinColor = '#fac715';
  if (isCreator) {
    pinColor = '#3b82f6';
  } else if (isFull) {
    pinColor = '#10B981';
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

export const useMeetupMap = ({
  filteredAds,
  loading,
  currentView,
  currentUserId,
  isAuthenticated,
  setHighlightedAdId
}: UseMeetupMapProps): UseMeetupMapReturn => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    if (currentView !== 'list' || loading) return;

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

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const mapInstance = mapRef.current;

    filteredAds.forEach(ad => {
      const lat = ad.latitude || (43.2630 + (Math.random() - 0.5) * 0.04);
      const lng = ad.longitude || (-2.9350 + (Math.random() - 0.5) * 0.04);

      const popupDiv = document.createElement('div');
      popupDiv.className = 'map-popup-content';

      const titleEl = document.createElement('h4');
      titleEl.className = 'map-popup-title';
      titleEl.innerText = `${getEstablishmentIcon(ad.establishmentType)} ${ad.location}`;

      const dateEl = document.createElement('p');
      dateEl.className = 'map-popup-date';
      dateEl.innerHTML = `📅 <strong>${formatScheduledDate(ad.scheduledAt, t)}</strong>`;
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
          if (!isAuthenticated) {
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
          sessionStorage.setItem('enbido_open_dm_target', JSON.stringify(target));
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

      const marker = L.marker([lat, lng], { icon: getMarkerIcon(ad, currentUserId) })
        .addTo(mapInstance)
        .bindPopup(popupDiv);

      marker.on('click', () => {
        setHighlightedAdId(ad.adId);
      });

      markersRef.current.set(ad.adId, marker);
    });

    if (filteredAds.length > 0) {
      const coords = filteredAds.map(ad => {
        const lat = ad.latitude || 43.2630;
        const lng = ad.longitude || -2.9350;
        return [lat, lng] as [number, number];
      });
      const bounds = L.latLngBounds(coords);
      mapInstance.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [filteredAds, loading, currentView, currentUserId, isAuthenticated, t, navigate, setHighlightedAdId]);

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

  return { mapRef, markersRef, handleCardClick };
};
