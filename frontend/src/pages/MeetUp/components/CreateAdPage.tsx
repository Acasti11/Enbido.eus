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
}

interface CreateAdPageProps {
  onCancel: () => void;
  onSubmit: (data: CreateAdFormState) => void;
}

const CreateAdPage: React.FC<CreateAdPageProps> = ({ onCancel, onSubmit }): React.JSX.Element => {
  const [formData, setFormData] = useState<CreateAdFormState>({
    location: '', 
    missingPlayers: '1', 
    description: ''
  });

  const [latitude, setLatitude] = useState<number>(43.2630); // Centro por defecto en Bilbao
  const [longitude, setLongitude] = useState<number>(-2.9350);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Inicializar mapa de selección
    const map = L.map('create-map', {
      center: [43.2630, -2.9350],
      zoom: 12,
      zoomControl: true,
    });

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

  const handleUpdateInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          
          <div className="form-group">
            <label className="form-label">Ubicación (Bar, Local, Ciudad): *</label>
            <input type="text" name="location" required className="form-input" placeholder="Ej: Taberna El Botxo" onChange={handleUpdateInput} />
          </div>

          <div className="form-group create-map-section">
            <label className="form-label">Ubica la partida en el mapa (Mueve el pin o haz clic):</label>
            <div id="create-map" className="create-map-box"></div>
            <span className="create-map-coordinates-label">
              Latitud: {latitude.toFixed(6)} | Longitud: {longitude.toFixed(6)}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Jugadores Faltantes: *</label>
            <input type="number" name="missingPlayers" min="1" max="3" required className="form-input" value={formData.missingPlayers} onChange={handleUpdateInput} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción de la partida: *</label>
            <textarea name="description" required className="form-textarea" placeholder="Reglas, nivel esperado, apuestas..." onChange={handleUpdateInput} />
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