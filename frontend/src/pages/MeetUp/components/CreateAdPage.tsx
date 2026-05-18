import React, { useState } from 'react';
import './create-ad-page.css';

// Integramos la interfaz aquí
export interface CreateAdFormState {
  location: string;
  missingPlayers: string;
  description: string;
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

  const handleUpdateInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="create-view">
      <div className="create-form-card">
        <form onSubmit={handleFormSubmit}>
          
          <div className="form-group">
            <label className="form-label">Ubicación (Bar, Local, Ciudad): *</label>
            <input type="text" name="location" required className="form-input" placeholder="Ej: Taberna El Botxo" onChange={handleUpdateInput} />
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