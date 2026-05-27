import React from 'react';
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
    return (
        <section className="shop-grid" aria-label="Objetos de tienda">
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
        </section>
    );
};

export default ShopGrid;