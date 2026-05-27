import React from 'react';
import type { CategoryTotal } from '../../../types/shop';

interface ShopSummaryProps {
  totals: CategoryTotal[];
}

const ShopSummary: React.FC<ShopSummaryProps> = ({ totals }): React.JSX.Element => {
    return (
        <section className="shop-summary" aria-label="Resumen de coleccion">
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