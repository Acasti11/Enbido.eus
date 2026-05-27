import React from 'react';
import type { ShopCategory } from'../../../types/shop';

const CATEGORY_LABELS: Record<ShopCategory, string> = {
    profiles: 'Profilak / Perfiles',
    decks: 'Kartak / Cartas',
    aliases: 'Ezizenak / Alias',
};

interface ShopToolbarProps {
    activeTab: ShopCategory;
    sortByPrice: 'none' | 'asc' | 'desc';
    onTabChange: (tab: ShopCategory) => void;
    onToggleSort: () => void;
}

const ShopToolbar: React.FC<ShopToolbarProps> = ({
    activeTab,
    sortByPrice,
    onTabChange,
    onToggleSort,
}): React.JSX.Element => {
    const sortLabel = sortByPrice === 'none'
        ? 'Sin ordenar'
        : sortByPrice === 'asc'
        ? 'Precio: Bajo a Alto'
        : 'Precio: Alto a Bajo';

    return (
            <section className="shop-toolbar" aria-label="Filtros de tienda">
            <div className="shop-toolbar__tabs" role="tablist" aria-label="Categorias">
                {(Object.entries(CATEGORY_LABELS) as [ShopCategory, string][]).map(([category, label]) => (
                <button
                    key={category}
                    className={activeTab === category ? 'shop-toolbar__tab shop-toolbar__tab--active' : 'shop-toolbar__tab'}
                    type="button"
                    onClick={() => onTabChange(category)}
                >
                    {label}
                </button>
                ))}
            </div>
            <button
                className="shop-toolbar__sort"
                type="button"
                onClick={onToggleSort}
            >
                {sortByPrice === 'none' ? '↕️ Ordenar por Precio' : `↕️ ${sortLabel}`}
            </button>
            </section>
        );
};

export default ShopToolbar;