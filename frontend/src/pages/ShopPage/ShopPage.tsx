import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShopData } from './hooks/useShopData';
import ShopToast from './components/ShopToast';
import ShopHero from './components/ShopHero';
import ShopSummary from './components/ShopSummary';
import ShopToolbar from './components/ShopToolbar';
import ShopGrid from './components/ShopGrid';
import ShopLoading from './components/ShopLoading';
import type { ShopCategory, ShopItem } from '../../types/shop';
import './shop-page.css';

const getItemDescription = (t: (key: string) => string, itemId: number): string => {
  switch (itemId) {
    case 1: return t('shop.itemDesc1');
    case 2: return t('shop.itemDesc2');
    case 3: return t('shop.itemDesc3');
    case 4: return t('shop.itemDesc4');
    case 5: return t('shop.itemDesc5');
    case 6: return t('shop.itemDesc6');
    default: return t('shop.itemDescDefault');
  }
};

const getItemAccent = (category: ShopCategory): 'gold' | 'red' | 'green' => {
  if (category === 'profiles') return 'gold';
  if (category === 'decks') return 'red';
  return 'green';
};

const ShopPage: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    coins,
    inventory,
    equippedAvatarItemId,
    equippedDeckItemId,
    equippedTitleItemId,
    items,
    loading,
    toast,
    handleBuy,
    handleEquip,
    handleUnequip,
    categoryTotals,
  } = useShopData();

  const [activeTab, setActiveTab] = useState<ShopCategory>('profiles');
  const [sortByPrice, setSortByPrice] = useState<'none' | 'asc' | 'desc'>('none');

  const username = localStorage.getItem('username') || t('shop.defaultUsername');
  const initials = username.slice(0, 2).toUpperCase();

  const mappedItems: ShopItem[] = useMemo(() => {
    return items.map((item: any) => {
      const itemId = Number(item.itemId);
      const category = (item.category || 'profiles') as ShopCategory;
      const description = getItemDescription(t, itemId);
      const accent = getItemAccent(category);
      const isOwned = inventory.includes(itemId);

      let isEquipped = false;
      if (category === 'profiles') isEquipped = equippedAvatarItemId === itemId;
      else if (category === 'decks') isEquipped = equippedDeckItemId === itemId;
      else if (category === 'aliases') isEquipped = equippedTitleItemId === itemId;

      return {
        id: itemId,
        category,
        name: item.name,
        price: Number(item.price),
        description,
        accent,
        owned: isOwned,
        equipped: isEquipped,
      };
    });
  }, [items, inventory, equippedAvatarItemId, equippedDeckItemId, equippedTitleItemId, t]);

  const filteredItems = mappedItems.filter((item) => item.category === activeTab);
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    if (sortByPrice === 'asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortByPrice === 'desc') sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [filteredItems, sortByPrice]);

  const handleToggleSort = () => {
    setSortByPrice((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  if (loading) {
    return <ShopLoading />;
  }

  return (
    <div className="shop-page">
      <ShopToast toast={toast} />
      <main className="shop-page__content">
        <ShopHero coins={coins} />
        <ShopSummary totals={categoryTotals} />
        <ShopToolbar
          activeTab={activeTab}
          sortByPrice={sortByPrice}
          onTabChange={setActiveTab}
          onToggleSort={handleToggleSort}
        />
        <ShopGrid
          items={sortedItems}
          initials={initials}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      </main>
    </div>
  );
};

export default ShopPage;
