import React from 'react';
import './stats-grid.css';

interface Stat {
  label: string;
  value: number | string;
  icon: string;
}

interface StatsGridProps {
  stats?: Stat[];
}

const DEFAULT_STATS: Stat[] = [
  {
    label: 'Partidas Jugadas',
    value: 42,
    icon: '🎴',
  },
  {
    label: 'Partidas Ganadas',
    value: 28,
    icon: '🏆',
  },
  {
    label: 'ELO',
    value: 1850,
    icon: '📊',
  },
  {
    label: 'Monedas',
    value: 5240,
    icon: '💰',
  },
];

const StatsGrid: React.FC<StatsGridProps> = ({ stats = DEFAULT_STATS }): React.JSX.Element => {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
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
