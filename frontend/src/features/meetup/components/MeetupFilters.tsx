import React from 'react';
import { useTranslation } from 'react-i18next';

interface MeetupFiltersProps {
  filterOnlyAvailable: boolean;
  filterOnlyMine: boolean;
  onToggleAvailable: (checked: boolean) => void;
  onToggleMine: (checked: boolean) => void;
}

const MeetupFilters: React.FC<MeetupFiltersProps> = ({
  filterOnlyAvailable,
  filterOnlyMine,
  onToggleAvailable,
  onToggleMine
}): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="meetup-filters-panel">
      <span className="filters-label">{t('meetup.filters')}</span>
      <label className="filter-checkbox-label">
        <input
          type="checkbox"
          className="filter-checkbox-input"
          checked={filterOnlyAvailable}
          onChange={(e) => onToggleAvailable(e.target.checked)}
        />
        <span>{t('meetup.filterAvailable')}</span>
      </label>
      <label className="filter-checkbox-label">
        <input
          type="checkbox"
          className="filter-checkbox-input"
          checked={filterOnlyMine}
          onChange={(e) => onToggleMine(e.target.checked)}
        />
        <span>{t('meetup.filterMine')}</span>
      </label>
    </div>
  );
};

export default MeetupFilters;
