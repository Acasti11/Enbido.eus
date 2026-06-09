import React from 'react';
import { useTranslation } from 'react-i18next';
import CoinIcon from './Coinicon';

interface ShopHeroProps {
    coins: number;
}

const ShopHero: React.FC<ShopHeroProps> = ({ coins }): React.JSX.Element => {
    const { t } = useTranslation();
    const formatCoins = (value: number): string => `${value.toLocaleString('es-ES')} ${t('shop.coinUnit')}`;

    return (
        <section className="shop-hero" aria-labelledby="shop-title">
        <div className="shop-hero__copy">
            <p className="shop-hero__eyebrow">{t('shop.title')}</p>
            <h1 id="shop-title">{t('shop.heroTitle')}</h1>
            <p>
            {t('shop.heroDesc')}
            </p>
        </div>

        <aside className="wallet-panel" aria-label={t('shop.balance')}>
            <span className="wallet-panel__label">{t('shop.balance')}</span>
            <strong>
            <CoinIcon />
            {formatCoins(coins)}
            </strong>
            <span className="wallet-panel__hint">{t('shop.balanceHint')}</span>
        </aside>
        </section>
    );
};

export default ShopHero;
