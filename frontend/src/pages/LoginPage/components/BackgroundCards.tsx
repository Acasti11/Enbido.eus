import React from 'react';
import '../styles/background-cards.css';

const BackgroundCards: React.FC = (): React.JSX.Element => {
  return (
    <>
      <div className="bg-card bg-card--left">
        <span className="bg-card__rank">1</span>
        <svg width="100" height="150" viewBox="0 0 100 150" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2">
          <path d="M50 20 C 65 60, 80 120, 50 140 C 20 120, 35 60, 50 20 Z" fill="rgba(255,255,255,0.02)" />
          <path d="M50 20 L50 140" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M30 110 Q 50 130 70 110" strokeWidth="4" />
          <path d="M50 115 L50 145" strokeWidth="6" />
        </svg>
        <span className="bg-card__rank bg-card__rank--bottom">1</span>
      </div>

      <div className="bg-card bg-card--right">
        <span className="bg-card__rank">12</span>
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2">
          <circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.02)" />
          <circle cx="50" cy="50" r="28" strokeDasharray="6 6" />
          <circle cx="50" cy="50" r="10" />
          <path d="M50 10 L50 22 M50 90 L50 78 M10 50 L22 50 M90 50 L78 50" strokeWidth="3" />
        </svg>
        <span className="bg-card__rank bg-card__rank--bottom">12</span>
      </div>
    </>
  );
};

export default BackgroundCards;