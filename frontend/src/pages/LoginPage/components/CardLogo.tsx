import React from 'react';
import '../styles/card-logo.css';

const CardLogoSideLeft: React.FC = (): React.JSX.Element => (
  <div className="card-logo__side card-logo__side--left">
    <span className="card-logo__rank card-logo__rank--green">1</span>
    <svg className="card-logo__suit" width="12" height="24" viewBox="0 0 12 24" fill="none" stroke="#2d6b45" strokeWidth="1.5">
      <path d="M6 2 L6 22 M3 8 L6 5 L9 8 M4 16 L6 19 L8 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="card-logo__rank card-logo__rank--green card-logo__rank--bottom">1</span>
  </div>
);

const CardLogoSideRight: React.FC = (): React.JSX.Element => (
  <div className="card-logo__side card-logo__side--right">
    <span className="card-logo__rank card-logo__rank--red">3</span>
    <div className="card-logo__hearts">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="#e63946">
        <path d="M2 4h20c0 7-4 12-10 12S2 11 2 4z" />
        <rect x="10" y="16" width="4" height="5" />
        <path d="M7 21h10v2H7z" />
      </svg>
      <div className="card-logo__hearts-row">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="#e63946">
          <path d="M2 4h20c0 7-4 12-10 12S2 11 2 4z" />
          <rect x="10" y="16" width="4" height="5" />
          <path d="M7 21h10v2H7z" />
        </svg>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="#e63946">
          <path d="M2 4h20c0 7-4 12-10 12S2 11 2 4z" />
          <rect x="10" y="16" width="4" height="5" />
          <path d="M7 21h10v2H7z" />
        </svg>
      </div>
    </div>
    <span className="card-logo__rank card-logo__rank--red card-logo__rank--bottom">3</span>
  </div>
);

const CardLogoCenter: React.FC = (): React.JSX.Element => (
  <div className="card-logo__center">
    <span className="card-logo__rank card-logo__rank--gold">12</span>
    <svg className="card-logo__suit" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
      <circle cx="12" cy="12" r="10" fill="rgba(212, 175, 55, 0.2)" />
      <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="2" fill="#d4af37" />
    </svg>
    <span className="card-logo__rank card-logo__rank--gold card-logo__rank--bottom">12</span>
  </div>
);

const CardLogo: React.FC = (): React.JSX.Element => (
  <div className="card-logo">
    <CardLogoSideLeft />
    <CardLogoSideRight />
    <CardLogoCenter />
  </div>
);

export default CardLogo;
