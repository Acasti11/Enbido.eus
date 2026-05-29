import React from 'react';
import type { TournamentFormState } from '../../../types/tournament';
import TextInput from '../../../components/ui/TextInput';
import RadioGroup from '../../../components/ui/RadioGroup';
import FileInput from '../../../components/ui/FileInput'

interface PublishFormFieldsProps {
  formState: TournamentFormState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const structureOptions = [
  { value: 'association', label: 'Elkartea / Asociación' },
  { value: 'professional', label: 'Profesionala / Profesional' }
];

const PublishFormFields = ({ formState, onChange }: PublishFormFieldsProps): React.JSX.Element => {
  return (
    <>
      <TextInput
        label="Txapelketaren izena / Nombre del torneo"
        name="tournamentName"
        value={formState.tournamentName}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label="Kontaktu emaila / Email de contacto"
        name="contactEmail"
        type="email"
        value={formState.contactEmail}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label="Kokapena / Ubicación"
        name="tournamentLocation"
        value={formState.tournamentLocation}
        onChange={onChange}
        isRequired
      />
      <RadioGroup
        label="Egitura / Estructura"
        name="tournamentStructure"
        value={formState.tournamentStructure}
        options={structureOptions}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label="Data / Fecha"
        name="tournamentDate"
        type="date"
        value={formState.tournamentDate}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label="Ordua / Hora"
        name="tournamentTime"
        type="time"
        value={formState.tournamentTime}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label="Parte-hartzaile kopuru maximoa / Máx. participantes"
        name="maxParticipants"
        type="number"
        value={formState.maxParticipants}
        onChange={onChange}
        isRequired
      />
      <div style={{ display: 'flex', gap: '15px' }}>
        <TextInput
          label="Izen-ematea (Monedas / tx)"
          name="coinsFee"
          type="number"
          value={formState.coinsFee || '0'}
          onChange={onChange}
          isRequired
        />
        <TextInput
          label="Saria Txapeldunarentzat (Monedas / tx)"
          name="coinsReward"
          type="number"
          value={formState.coinsReward || '0'}
          onChange={onChange}
          isRequired
        />
      </div>
      <TextInput
        label="Izen-emate prezioa / Precio inscripción (€)"
        name="inscriptionPrice"
        type="number"
        value={formState.inscriptionPrice}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label="Sariak / Premios"
        name="tournamentPrizes"
        value={formState.tournamentPrizes}
        onChange={onChange}
      />
      <TextInput
        label="Beste xehetasunak / Otros detalles"
        name="otherDetails"
        value={formState.otherDetails}
        onChange={onChange}
      />
      <FileInput
        label="Kartela / Cartel"
        name="posterImage"
        onChange={onChange}
      />
    </>
  );
};

export default PublishFormFields;