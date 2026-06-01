import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ShopCategory } from'../../../types/shop';

const getCategoryKey = (category: ShopCategory): string => {
    if (category === 'profiles') return 'shop.categoryProfiles';
    if (category === 'decks') return 'shop.categoryDecks';
    return 'shop.categoryAliases';
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
    const { t } = useTranslation();

    const sortLabel = sortByPrice === 'none'
        ? t('shop.sortNone')
        : sortByPrice === 'asc'
        ? t('shop.sortAsc')
        : t('shop.sortDesc');

    const categories: ShopCategory[] = ['profiles', 'decks', 'aliases'];

    return (
            <section className="shop-toolbar" aria-label={t('shop.gridAriaLabel')}>
            <div className="shop-toolbar__tabs" role="tablist" aria-label={t('shop.gridAriaLabel')}>
                {categories.map((category) => (
                <button
                    key={category}
                    className={activeTab === category ? 'shop-toolbar__tab shop-toolbar__tab--active' : 'shop-toolbar__tab'}
                    type="button"
                    onClick={() => onTabChange(category)}
                >
                    {t(getCategoryKey(category))}
                </button>
                ))}
            </div>
            <button
                className="shop-toolbar__sort"
                type="button"
                onClick={onToggleSort}
            >
                {sortByPrice === 'none' ? t('shop.sortPrice') : `↕️ ${sortLabel}`}
            </button>
            </section>
        );
};

export default ShopToolbar;
