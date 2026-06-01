import React from 'react';
import { useTranslation } from 'react-i18next';

const ShopLoading: React.FC = (): React.JSX.Element => {
    const { t } = useTranslation();
    return (
      <div className="shop-page shop-page-loading-wrapper">
        <div className="shop-loading shop-loading-box">
          <div className="spinner shop-loading-spinner" />
            <h2>{t('shop.loading')}</h2>
            </div>
        </div>
      );
};


export default ShopLoading;
