import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import './shop-page.css';

interface Category {
  categoryId: number;
  name: string;
  description: string;
}

interface ShopItem {
  itemId: number;
  categoryId: number;
  name: string;
  price: number;
}

const ITEM_ICONS: Record<string, string> = {
  'Avatares': '🎭',
  'Barajas': '🃏',
  'Títulos': '🏅',
};

const ShopPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/shop/categories'),
        api.get('/shop/items'),
      ]);
      setCategories(catRes.data);
      setItems(itemRes.data);
    } catch (error) {
      console.error('Error fetching shop data', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: number): string => {
    const cat = categories.find(c => c.categoryId === categoryId);
    return cat ? cat.name : 'General';
  };

  const getIcon = (categoryId: number): string => {
    const name = getCategoryName(categoryId);
    return ITEM_ICONS[name] || '🎁';
  };

  const filteredItems = selectedCategory
    ? items.filter(i => i.categoryId === selectedCategory)
    : items;

  return (
    <div className="page-container">
      <Navbar />
      <main className="shop-page-content">
        <header className="shop-header">
          <h1 className="shop-title">Tienda</h1>
          <p className="shop-subtitle">Personaliza tu experiencia de juego</p>
        </header>

        {/* Category Tabs */}
        <div className="shop-categories">
          <button
            className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.categoryId}
              className={`category-tab ${selectedCategory === cat.categoryId ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.categoryId)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items */}
        {loading ? (
          <div className="shop-loading">Cargando tienda...</div>
        ) : filteredItems.length === 0 ? (
          <div className="shop-empty">No hay artículos disponibles en esta categoría.</div>
        ) : (
          <div className="shop-items-grid">
            {filteredItems.map(item => (
              <div key={item.itemId} className="shop-item-card">
                <div className="item-icon">{getIcon(item.categoryId)}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-category-badge">{getCategoryName(item.categoryId)}</div>
                <div className="item-price">
                  {item.price} <span className="coin-icon">🪙</span>
                </div>
                <button className="buy-button">Comprar</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ShopPage;
