import React from 'react';
import { useTranslation } from 'react-i18next';
import CoinIcon from './Coinicon';
import type { ShopItem, ShopCategory } from '../../../types/shop';

interface ShopCardProps {
  item: ShopItem;
  initials: string;
  onBuy: (id: number, price: number, name: string) => void;
  onEquip: (id: number, category: ShopCategory, name: string) => void;
  onUnequip: (category: ShopCategory, name: string) => void;
}

interface ShopCardPreviewProps {
  item: ShopItem;
  initials: string;
}

const getCategoryLabelKey = (category: ShopCategory): string => {
  if (category === 'profiles') return 'shop.categoryProfiles';
  if (category === 'decks') return 'shop.categoryDecks';
  return 'shop.categoryAliases';
};

const getStateLabel = (t: (key: string) => string, equipped: boolean, owned: boolean): string => {
  if (equipped) return t('shop.activeNow');
  if (owned) return t('shop.owned');
  return t('shop.available');
};

const getButtonLabel = (t: (key: string) => string, equipped: boolean, owned: boolean): string => {
  if (equipped) return t('shop.equipped');
  if (owned) return t('shop.equip');
  return t('shop.buy');
};

const ShopCardPreview: React.FC<ShopCardPreviewProps> = ({ item, initials }): React.JSX.Element => {
  if (item.category === 'profiles') {
    let ringClass = '';
    if (item.id === 1) ringClass = 'shop-card__profile-ring--gold';
    else if (item.id === 2) ringClass = 'shop-card__profile-ring--green';
    else if (item.id === 7) ringClass = 'shop-card__profile-ring--ikurrina';
    else if (item.id === 8) ringClass = 'shop-card__profile-ring--karta';

    return (
      <div className="shop-card__profile">
        <div className="shop-card__avatar">{initials}</div>
        <div className={`shop-card__profile-ring ${ringClass}`} />
      </div>
    );
  }

  if (item.category === 'decks') {
    let cardBackClass = '';
    if (item.id === 3) cardBackClass = 'euskal-back';
    else if (item.id === 4) cardBackClass = 'gau-beltza-back';
    else if (item.id === 9) cardBackClass = 'klasikoa-back';
    else if (item.id === 10) cardBackClass = 'berezia-back';

    return (
      <div className="shop-card__deck" aria-hidden="true">
        <div className={`shop-card__playing-card shop-card__playing-card--left ${cardBackClass}`}>
          <span>4</span>
          <span>&clubs;</span>
        </div>
        <div className={`shop-card__playing-card shop-card__playing-card--right ${cardBackClass}`}>
          <span>7</span>
          <span>&hearts;</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-card__alias">
      <span>{item.name}</span>
    </div>
  );
};

const ShopCard: React.FC<ShopCardProps> = ({ item, initials, onBuy, onEquip, onUnequip }): React.JSX.Element => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (item.equipped) {
      onUnequip(item.category, item.name);
    } else if (item.owned) {
      onEquip(item.id, item.category, item.name);
    } else {
      onBuy(item.id, item.price, item.name);
    }
  };

  const categoryLabelKey = getCategoryLabelKey(item.category);
  const stateLabel = getStateLabel(t, item.equipped, item.owned);
  const buttonLabel = getButtonLabel(t, item.equipped, item.owned);

  return (
    <article className={`shop-card shop-card--${item.accent}`}>
      <div className="shop-card__media">
        <span className="shop-card__category">{t(categoryLabelKey)}</span>
        <ShopCardPreview item={item} initials={initials} />
      </div>

      <div className="shop-card__body">
        <div className="shop-card__title-row">
          <h2>{item.name}</h2>
          {!item.owned && (
            <span className="shop-card__price">
              <CoinIcon />
              {item.price.toLocaleString('es-ES')} {t('shop.coinUnit')}
            </span>
          )}
        </div>
        <p>{item.description}</p>
      </div>

      <div className="shop-card__footer">
        <span className="shop-card__state">{stateLabel}</span>
        <button
          className="shop-card__button"
          type="button"
          onClick={handleClick}
          style={{
            backgroundColor: item.equipped ? 'rgba(212, 175, 55, 0.2)' : undefined,
            color: item.equipped ? '#f1cd4f' : undefined,
            border: item.equipped ? '1px solid #f1cd4f' : undefined,
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
};

export default ShopCard;
