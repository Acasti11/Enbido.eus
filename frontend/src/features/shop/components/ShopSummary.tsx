import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryTotal } from '@/features/shop/types/shop';

interface ShopSummaryProps {
  totals: CategoryTotal[];
}

const ShopSummary: React.FC<ShopSummaryProps> = ({ totals }): React.JSX.Element => {
    const { t } = useTranslation();
    return (
        <section className="shop-summary" aria-label={t('shop.summaryAriaLabel')}>
        {totals.map((category) => (
            <div key={category.category} className="shop-summary__item">
            <span>{category.label}</span>
            <strong>
                {category.owned}/{category.total}
            </strong>
            </div>
        ))}
        </section>
    );
};

export default ShopSummary;
