import React from 'react';
import CoinIcon from './Coinicon';

interface ShopHeroProps {
    coins: number;
}

const ShopHero: React.FC<ShopHeroProps> = ({ coins }): React.JSX.Element => {
    const formatCoins = (value: number): string => `${value.toLocaleString('es-ES')} tx`;

    return (
        <section className="shop-hero" aria-labelledby="shop-title">
        <div className="shop-hero__copy">
            <p className="shop-hero__eyebrow">Denda / Tienda</p>
            <h1 id="shop-title">Personaliza tu mesa de mus</h1>
            <p>
            Gana partidas, suma monedas y desbloquea perfiles, barajas y alias
            para entrar a la partida con tu propio estilo.
            </p>
        </div>

        <aside className="wallet-panel" aria-label="Monedas disponibles">
            <span className="wallet-panel__label">Saldo</span>
            <strong>
            <CoinIcon />
            {formatCoins(coins)}
            </strong>
            <span className="wallet-panel__hint">+25 tx por cada victoria</span>
        </aside>
        </section>
    );
};

export default ShopHero;