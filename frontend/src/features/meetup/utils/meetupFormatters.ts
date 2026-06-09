export const getEstablishmentIcon = (type: string | undefined): string => {
  switch (type) {
    case 'TXOKO': return '🍽️';
    case 'CAFE': return '☕';
    case 'OUTDOOR': return '🌳';
    case 'BAR':
    default:
      return '🍻';
  }
};

export const formatScheduledDate = (dateStr: string | undefined, t: (key: string) => string): string => {
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
