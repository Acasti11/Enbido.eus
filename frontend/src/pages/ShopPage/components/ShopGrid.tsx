import React from 'react';
import { useTranslation } from 'react-i18next';
import ShopCard from './ShopCard';
import type { ShopItem, ShopCategory } from '../../../types/shop';

interface ShopGridProps {
    items: ShopItem[];
    initials: string;
    onBuy: (id: number, price: number, name: string) => void;
    onEquip: (id: number, category: ShopCategory, name: string) => void;
    onUnequip: (category: ShopCategory, name: string) => void;
}

const ShopGrid: React.FC<ShopGridProps> = ({ items, initials, onBuy, onEquip, onUnequip }): React.JSX.Element => {
    const { t } = useTranslation();
    return (
        <div className="shop-grid" aria-label={t('shop.gridAriaLabel')}>
        {items.map((item) => (
            <ShopCard
            key={item.id}
            item={item}
            initials={initials}
            onBuy={onBuy}
            onEquip={onEquip}
            onUnequip={onUnequip}
            />
        ))}
        </div>
    );
};

export default ShopGrid;
