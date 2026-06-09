import React from 'react';
import type { TournamentFormState } from '@/features/tournament/types/tournament';
import TextInput from '@/shared/components/ui/TextInput';
import RadioGroup from '@/shared/components/ui/RadioGroup';
import FileInput from '@/shared/components/ui/FileInput'
import { useTranslation } from 'react-i18next';


interface PublishFormFieldsProps {
  formState: TournamentFormState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}





const PublishFormFields = ({ formState, onChange }: PublishFormFieldsProps): React.JSX.Element => {
   const { t } = useTranslation();

 
const structureOptions = [
  { value: 'association', label: t('tournament.association')},
  { value: 'professional', label: t('tournament.professional')},
];
 
  return (
    <>
      <TextInput
        label={t('tournament.tournamentName')}
        name="tournamentName"
        value={formState.tournamentName}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label={t('tournament.tournamentContactEmail')}
        name="contactEmail"
        type="email"
        value={formState.contactEmail}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label={t('tournament.tournamentlocation')}
        name="tournamentLocation"
        value={formState.tournamentLocation}
        onChange={onChange}
        isRequired
      />
      <RadioGroup
        label={t('tournament.tournamentStructure')}
        name="tournamentStructure"
        value={formState.tournamentStructure}
        options={structureOptions}
        onChange={onChange}
        isRequired
      /> 
      <TextInput
        label={t('tournament.tournamentDate')}
        name="tournamentDate"
        type="date"
        value={formState.tournamentDate}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label={t('tournament.tournamentTime')}
        name="tournamentTime"
        type="time"
        value={formState.tournamentTime}
        onChange={onChange}
        isRequired
      />
      <TextInput
        label={t('tournament.maxParticipants')}
        name="maxParticipants"
        type="number"
        value={formState.maxParticipants}
        onChange={onChange}
        isRequired
      />
      <div className="form-row">
        <TextInput
        label={t('tournament.coinsFee')}
          name="coinsFee"
          type="number"
          value={formState.coinsFee || '0'}
          onChange={onChange}
          isRequired
        />
        <TextInput
        label={t('tournament.coinsReward')}
          name="coinsReward"
          type="number"
          value={formState.coinsReward || '0'}
          onChange={onChange}
          isRequired
        />
      </div>
            <TextInput
        label={t('tournament.coinsFee')}
        name="inscriptionPrice"
        type="number"
        value={formState.inscriptionPrice}
        onChange={onChange}
        isRequired
      />
            <TextInput
        label={t('tournament.tournamentPrizes')}
        name="tournamentPrizes"
        value={formState.tournamentPrizes}
        onChange={onChange}
      />

      <TextInput
        label={t('tournament.otherDetails')}
        name="otherDetails"
        value={formState.otherDetails}
        onChange={onChange}
      />
      <FileInput
        label={t('tournament.posterImage')}
        name="posterImage"
        onChange={onChange}
      />
    </>
  );
};

export default PublishFormFields;