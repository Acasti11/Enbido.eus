import React from 'react';

const CoinIcon: React.FC = (): React.JSX.Element => (
    <svg className="coin-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5a5 5 0 1 0 0 7" />
    </svg>
);

export default CoinIcon;