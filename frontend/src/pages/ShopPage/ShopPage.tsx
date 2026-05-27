import React, { useState, useMemo } from 'react';
import { useShopData } from './hooks/useShopData';
import ShopToast from './components/ShopToast';
import ShopHero from './components/ShopHero';
import ShopSummary from './components/ShopSummary';
import ShopToolbar from './components/ShopToolbar';
import ShopGrid from './components/ShopGrid';
import ShopLoading from './components/ShopLoading';
import type { ShopCategory, ShopItem } from '../../types/shop';
import './shop-page.css';

const ITEM_METADATA: Record<number, { description: string; accent: 'gold' | 'red' | 'green' }> = {
  1: { description: 'Marco dorado y ficha premium para partidas ganadas.', accent: 'gold' },
  2: { description: 'Avatar sobrio con textura de pared verde.', accent: 'green' },
  3: { description: 'Cartas crema con palos marcados en rojo y verde.', accent: 'red' },
  4: { description: 'Reverso oscuro con detalles dorados para mesas nocturnas.', accent: 'gold' },
  5: { description: 'Alias visible bajo tu nombre en el perfil de jugador.', accent: 'green' },
  6: { description: 'Título para quien sabe cuándo apretar la apuesta.', accent: 'red' },
};

const ShopPage: React.FC = (): React.JSX.Element => {
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

  // Info del usuario desde localStorage (ahora guardamos token, no objeto completo)
  const username = localStorage.getItem('username') || 'Usuario';
  const initials = username.slice(0, 2).toUpperCase();

  // Mapear items con metadatos visuales y estado de inventario
  const mappedItems: ShopItem[] = useMemo(() => {
    return items.map((item: any) => {
      const itemId = Number(item.itemId);
      const category = (item.category || 'profiles') as ShopCategory;
      const metadata = ITEM_METADATA[itemId] || {
        description: 'Objeto de personalización exclusiva.',
        accent: category === 'profiles' ? 'gold' : category === 'decks' ? 'red' : 'green',
      };

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
        description: metadata.description,
        accent: metadata.accent,
        owned: isOwned,
        equipped: isEquipped,
      };
    });
  }, [items, inventory, equippedAvatarItemId, equippedDeckItemId, equippedTitleItemId]);

  // Filtrar y ordenar
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