import React, { useState } from 'react';
import type { TournamentFormState } from '../../../types/tournament';
import { CONST_INITIAL_FORM_STATE } from '../constants';

interface PublishFormProps {
  onAddTournament: (data: TournamentFormState) => void;
  onCancelPublish: () => void;
}

const PublishForm = ({ onAddTournament, onCancelPublish }: PublishFormProps): React.JSX.Element => {
  const [formState, setFormState] = useState<TournamentFormState>(CONST_INITIAL_FORM_STATE);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTournament(formState);
  };

  return (
    <div className="publish-form-container">
      <form className="tournament-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Izena / Nombre</label>
          <input type="text" name="tournamentName" value={formState.tournamentName} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Lekua / Lugar</label>
          <input type="text" name="tournamentLocation" value={formState.tournamentLocation} onChange={handleChange} required />
        </div>

        <div className="form-group row">
          <div className="col">
            <label>Eguna / Fecha</label>
            <input type="date" name="tournamentDate" value={formState.tournamentDate} onChange={handleChange} required />
          </div>
          <div className="col">
            <label>Ordua / Hora</label>
            <input type="time" name="tournamentTime" value={formState.tournamentTime} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group row">
          <div className="col">
            <label>Parte-hartzaileak / Max. Equipos</label>
            <input type="number" name="maxParticipants" value={formState.maxParticipants} onChange={handleChange} />
          </div>
          <div className="col">
            <label>Prezioa / Inscripción (€)</label>
            <input type="number" name="inscriptionPrice" value={formState.inscriptionPrice} onChange={handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancelPublish}>Utzi / Cancelar</button>
          <button type="submit" className="btn-submit">Gorde / Guardar</button>
        </div>
      </form>
    </div>
  );
};

export default PublishForm;