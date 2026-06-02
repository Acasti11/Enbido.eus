import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/stats-grid.css';

interface Stat {
  label: string;
  value: number | string;
  icon: string;
}

interface StatsGridProps {
  stats?: Stat[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }): React.JSX.Element => {
  const { t } = useTranslation();

  const defaultStats: Stat[] = [
    { label: t('profile.gamesPlayed'), value: 42, icon: '🎴' },
    { label: t('profile.gamesWon'), value: 28, icon: '🏆' },
    { label: t('profile.elo'), value: 1850, icon: '📊' },
    { label: t('profile.coins'), value: 5240, icon: '💰' },
  ];

  const displayStats = stats ?? defaultStats;

  return (
    <div className="stats-grid">
      {displayStats.map((stat, index) => (
        <div key={index} className="stats-grid__item">
          <div className="stats-grid__icon">{stat.icon}</div>
          <p className="stats-grid__label">{stat.label}</p>
          <h2 className="stats-grid__value">{stat.value}</h2>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
