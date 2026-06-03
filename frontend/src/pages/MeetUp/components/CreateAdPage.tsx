import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/create-ad-page.css';

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

export interface CreateAdFormState {
  location: string;
  missingPlayers: string;
  description: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  establishmentType?: string;
}

interface CreateAdPageProps {
  onCancel: () => void;
  onSubmit: (data: CreateAdFormState) => void;
}

const CreateAdPage: React.FC<CreateAdPageProps> = ({ onCancel, onSubmit }): React.JSX.Element => {
  const [formData, setFormData] = useState<CreateAdFormState>({
    location: '',
    missingPlayers: '1',
    description: '',
    scheduledAt: '',
    establishmentType: 'BAR'
  });

  const [latitude, setLatitude] = useState<number>(43.2630); // Centro por defecto en Bilbao
  const [longitude, setLongitude] = useState<number>(-2.9350);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Inicializar mapa de selección
    const isMobile = window.innerWidth < 768;
    const mapOptions: L.MapOptions & { tap?: boolean } = {
      center: [43.2630, -2.9350],
      zoom: 12,
      zoomControl: true,
      dragging: !isMobile,
      tap: !isMobile,
    };
    const map = L.map('create-map', mapOptions);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Añadir pin marcador inicial
    const marker = L.marker([43.2630, -2.9350], { draggable: true }).addTo(map);
    markerRef.current = marker;
    mapRef.current = map;

    // Escuchar el arrastre del marcador
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
    });

    // Escuchar clicks en el mapa para recolocar el pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    });

    return () => {
      map.remove();
    };
  }, []);

  const handleUpdateInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const searchLocationOnOSM = async (e: React.MouseEvent) => {
    e.preventDefault();
    const query = formData.location.trim();
    if (!query) return;
    try {
      setIsSearchingLocation(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', España')}&format=json&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error searching location:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSuggestion = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    const shortName = s.display_name.split(',')[0] || s.display_name;

    setFormData(prev => ({
      ...prev,
      location: shortName
    }));

    setLatitude(lat);
    setLongitude(lng);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15);
    }
    setSuggestions([]);
  };

  const handleUseCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador');
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      setLatitude(lat);
      setLongitude(lng);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15);
      }
    }, (error) => {
      console.error(error);
      alert('No se pudo acceder a tu ubicación real. Por favor, actívala en tu navegador.');
    });
  };

  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit({
      ...formData,
      latitude,
      longitude
    });
  };

  return (
    <div className="create-view">
      <div className="create-form-card">
        <form onSubmit={handleFormSubmit}>

          <div className="form-group create-location-gorup">
            <label className="form-label">Ubicación (Bar, Local, Ciudad): *</label>
            <div className="create-location-row">
              <input
                type="text"
                name="location"
                required
                className="form-input create-location-input"
                placeholder="Ej: Taberna El Botxo"
                value={formData.location}
                onChange={handleUpdateInput}
              />
              <button
                type="button"
                onClick={searchLocationOnOSM}
                className="btn-search-osm"
                disabled={isSearchingLocation}
              >
                {isSearchingLocation ? 'Buscando...' : '🔍 Buscar en Mapa'}
              </button>
            </div>

            {/* SUGGESTIONS LIST */}
            {suggestions.length > 0 && (
              <ul className="osm-suggestions-list">
                {suggestions.map((s, idx) => (
                  <li key={idx} onClick={() => handleSelectSuggestion(s)} className="osm-suggestion-item">
                    📍 {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group create-map-section">
            <div className="create-map-header">
              <label className="form-label create-map-label">Ubica la partida en el mapa (Mueve el pin o haz clic):</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="btn-gps-locate"
              >
                🎯 Usar mi ubicación actual
              </button>
            </div>
            <div id="create-map" className="create-map-box"></div>
            <span className="create-map-coordinates-label">
              Latitud: {latitude.toFixed(6)} | Longitud: {longitude.toFixed(6)}
            </span>
          </div>

          <div className="create-form-row">
            <div className="form-group create-form-column">
              <label className="form-label">Fecha y Hora del encuentro: *</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                required
                className="form-input"
                value={formData.scheduledAt}
                onChange={handleUpdateInput}
              />
            </div>

            <div className="form-group create-form-column">
              <label className="form-label">Tipo de establecimiento: *</label>
              <select
                name="establishmentType"
                required
                className="form-input create-establishment-select"
                value={formData.establishmentType || 'BAR'}
                onChange={handleUpdateInput}
              >
                <option value="BAR">🍻 Taberna / Bar</option>
                <option value="TXOKO">🍽️ Sociedad Gastronómica / Txoko</option>
                <option value="CAFE">☕ Cafetería</option>
                <option value="OUTDOOR">🌳 Exterior / Parque</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jugadores Faltantes: *</label>
            <input type="number" name="missingPlayers" min="1" max="3" required className="form-input" value={formData.missingPlayers} onChange={handleUpdateInput} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción de la partida: *</label>
            <textarea name="description" required className="form-textarea" placeholder="Reglas, nivel esperado, apuestas..." value={formData.description} onChange={handleUpdateInput} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel-form" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-submit-form">Publicar Anuncio</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateAdPage;