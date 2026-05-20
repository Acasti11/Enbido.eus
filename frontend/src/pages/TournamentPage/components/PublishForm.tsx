import React, { useState } from 'react';
import type { TournamentFormState } from '../../../types/tournament';
import { CONST_INITIAL_FORM_STATE } from '../constants';
import PublishFormFields from './PublishFormFields';

interface PublishFormProps {
  onAddTournament: (data: TournamentFormState) => void;
  onCancelPublish: () => void;
}

const PublishForm = ({ onAddTournament, onCancelPublish }: PublishFormProps): React.JSX.Element => {
  const [formState, setFormState] = useState<TournamentFormState>(CONST_INITIAL_FORM_STATE);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onAddTournament(formState);
  };

  return (
    <div className="form-container">
      <div className="form-header-box">
        <h2 className="form-title">Zure txapelketa argitaratu</h2>
        <p className="form-subtitle">Rellena los datos de tu torneo</p>
      </div>
      <form onSubmit={handleSubmit}>
        <PublishFormFields formState={formState} onChange={handleChange} />
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancelPublish}>
            Ezeztatu / Cancelar
          </button>
          <button type="submit" className="btn-submit">
            Argitaratu / Publicar
          </button>
        </div>
      </form>
      <div className="contact-footer">
        Arazorik bada / Si tienes problemas:{' '}
        <a href="mailto:harreman@mus.eus" className="contact-link">harreman@mus.eus</a>
      </div>
    </div>
  );
};

export default PublishForm;