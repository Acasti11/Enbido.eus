import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import './shop-page.css';

type ShopCategory = 'profiles' | 'decks' | 'aliases' | 'boards';

type ShopItem = {
  id: number;
  category: ShopCategory;
  name: string;
  description: string;
  price: number;
  owned?: boolean;
  equipped?: boolean;
  accent: 'gold' | 'red' | 'green';
};

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  profiles: 'Profilak / Perfiles',
  decks: 'Kartak / Cartas',
  aliases: 'Ezizenak / Alias',
  boards: 'Tapeteak / Tapetes',
};

const ITEM_METADATA: Record<number, { description: string; accent: 'gold' | 'red' | 'green' }> = {
  1: {
    description: 'Marco dorado y ficha premium para partidas ganadas.',
    accent: 'gold',
  },
  2: {
    description: 'Avatar sobrio con textura de pared verde.',
    accent: 'green',
  },
  3: {
    description: 'Cartas crema con palos marcados en rojo y verde.',
    accent: 'red',
  },
  4: {
    description: 'Reverso oscuro con detalles dorados para mesas nocturnas.',
    accent: 'gold',
  },
  5: {
    description: 'Alias visible bajo tu nombre en el perfil de jugador.',
    accent: 'green',
  },
  6: {
    description: 'Título para quien sabe cuándo apretar la apuesta.',
    accent: 'red',
  },
  7: {
    description: 'Un elegante tapete azul real con costuras plateadas de tacto satinado.',
    accent: 'gold',
  },
  8: {
    description: 'Diseño ultra premium negro aterciopelado con ribetes de oro para mesas clandestinas.',
    accent: 'red',
  },
  9: {
    description: 'Clásico paño verde de casino de lujo con marcaje dorado y acabados de caoba noble.',
    accent: 'gold',
  },
};

const CoinIcon: React.FC = (): React.JSX.Element => (
  <svg className="coin-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5a5 5 0 1 0 0 7" />
  </svg>
);

const ShopPage: React.FC = (): React.JSX.Element => {
  // Extraer información del usuario logueado en localStorage
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = savedUser.userId || savedUser.user_id || 1;
  const username = savedUser.username || 'Usuario';
  const initials = username.slice(0, 2).toUpperCase();

  // Estados del inventario y tienda
  const [coins, setCoins] = useState<number>(0);
  const [inventory, setInventory] = useState<number[]>([]);
  const [equippedAvatarItemId, setEquippedAvatarItemId] = useState<number | null>(null);
  const [equippedDeckItemId, setEquippedDeckItemId] = useState<number | null>(null);
  const [equippedTitleItemId, setEquippedTitleItemId] = useState<number | null>(null);
  const [equippedBoardItemId, setEquippedBoardItemId] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ShopCategory>('profiles');
  const [sortByPrice, setSortByPrice] = useState<'none' | 'asc' | 'desc'>('none');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Obtener objetos de la tienda
      const itemsRes = await api.get('/shop/items');
      setItems(itemsRes.data);

      // 2. Obtener el perfil del usuario (monedas y equipamiento)
      const profileRes = await api.get(`/usuarios/${currentUserId}/profile`);
      setCoins(profileRes.data.coins);
      setEquippedAvatarItemId(profileRes.data.equippedAvatarItemId || null);
      setEquippedDeckItemId(profileRes.data.equippedDeckItemId || null);
      setEquippedTitleItemId(profileRes.data.equippedTitleItemId || null);
      setEquippedBoardItemId(profileRes.data.equippedBoardItemId || null);

      // 3. Obtener el inventario del usuario
      const invRes = await api.get(`/usuarios/${currentUserId}/inventory`);
      setInventory(invRes.data);
    } catch (err) {
      console.error('Error fetching shop data:', err);
      showToast('Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  // Acciones: Comprar, Equipar, Desequipar
  const handleBuy = async (itemId: number, price: number, name: string) => {
    if (coins < price) {
      showToast('No tienes suficientes monedas (tx) para este objeto', 'error');
      return;
    }
    try {
      const res = await api.post(`/usuarios/${currentUserId}/buy/${itemId}`);
      showToast(`¡Has comprado "${name}" con éxito!`, 'success');
      if (res.data && typeof res.data.newCoins === 'number') {
        setCoins(res.data.newCoins);
      } else {
        setCoins((prev) => prev - price);
      }
      setInventory((prev) => [...prev, itemId]);
    } catch (err: any) {
      const errMsg = err.response?.data || 'Error al realizar la compra';
      showToast(errMsg, 'error');
    }
  };

  const handleEquip = async (itemId: number, category: ShopCategory, name: string) => {
    try {
      await api.post(`/usuarios/${currentUserId}/equip/${itemId}`);
      showToast(`¡Has equipado "${name}"!`, 'success');
      if (category === 'profiles') {
        setEquippedAvatarItemId(itemId);
      } else if (category === 'decks') {
        setEquippedDeckItemId(itemId);
      } else if (category === 'aliases') {
        setEquippedTitleItemId(itemId);
      } else if (category === 'boards') {
        setEquippedBoardItemId(itemId);
      }
    } catch (err: any) {
      const errMsg = err.response?.data || 'Error al equipar el objeto';
      showToast(errMsg, 'error');
    }
  };

  const handleUnequip = async (category: ShopCategory, name: string) => {
    try {
      await api.post(`/usuarios/${currentUserId}/unequip/${category}`);
      showToast(`¡Has desequipado "${name}"!`, 'success');
      if (category === 'profiles') {
        setEquippedAvatarItemId(null);
      } else if (category === 'decks') {
        setEquippedDeckItemId(null);
      } else if (category === 'aliases') {
        setEquippedTitleItemId(null);
      } else if (category === 'boards') {
        setEquippedBoardItemId(null);
      }
    } catch (err: any) {
      const errMsg = err.response?.data || 'Error al desequipar el objeto';
      showToast(errMsg, 'error');
    }
  };

  // Mapeo de objetos de la base de datos combinando metadatos visuales
  const mappedItems: ShopItem[] = items.map((item: any) => {
    const itemId = Number(item.itemId || item.id);
    let category = item.category;
    if (!category) {
       if (item.categoryId === 1) category = 'profiles';
       else if (item.categoryId === 2) category = 'decks';
       else if (item.categoryId === 3) category = 'aliases';
       else if (item.categoryId === 4) category = 'boards';
    }
    const catTyped = category as ShopCategory;
    const metadata = ITEM_METADATA[itemId] || {
      description: 'Objeto de personalización exclusiva.',
      accent: catTyped === 'profiles' ? 'gold' : catTyped === 'decks' ? 'red' : catTyped === 'boards' ? 'gold' : 'green',
    };

    const isOwned = inventory.some((id: any) => Number(id) === itemId);

    let isEquipped = false;
    if (category === 'profiles') {
      isEquipped = equippedAvatarItemId === itemId;
    } else if (category === 'decks') {
      isEquipped = equippedDeckItemId === itemId;
    } else if (category === 'aliases') {
      isEquipped = equippedTitleItemId === itemId;
    } else if (category === 'boards') {
      isEquipped = equippedBoardItemId === itemId;
    }

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

  // Filtrado por categoría
  const filteredItems = mappedItems.filter((item) => item.category === activeTab);

  // Ordenación por precio
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortByPrice === 'asc') return a.price - b.price;
    if (sortByPrice === 'desc') return b.price - a.price;
    return 0;
  });

  // Cálculo de totales de colecciones
  const categoryTotals = Object.entries(CATEGORY_LABELS).map(([category, label]) => {
    const catItems = mappedItems.filter((item) => item.category === category);
    return {
      category: category as ShopCategory,
      label,
      owned: catItems.filter((item) => item.owned).length,
      total: catItems.length,
    };
  });

  const handleToggleSort = () => {
    setSortByPrice((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const sortLabel = sortByPrice === 'none'
    ? 'Sin ordenar'
    : sortByPrice === 'asc'
    ? 'Precio: Bajo a Alto'
    : 'Precio: Alto a Bajo';

  const formatCoins = (value: number): string => `${value.toLocaleString('es-ES')} tx`;

  const renderPreview = (item: ShopItem): React.JSX.Element => {
    if (item.category === 'profiles') {
      const ringStyleClass = item.id === 1 ? 'shop-card__profile-ring--gold' : 'shop-card__profile-ring--green';
      return (
        <div className="shop-card__profile">
          <div className="shop-card__avatar">{initials}</div>
          <div className={`shop-card__profile-ring ${ringStyleClass}`} />
        </div>
      );
    }

    if (item.category === 'decks') {
      const cardBackClass = item.id === 3 ? 'euskal-back' : 'gau-beltza-back';
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

  const renderShopItem = (item: ShopItem): React.JSX.Element => {
    const buttonLabel = item.equipped ? 'Equipado' : item.owned ? 'Equipar' : 'Comprar';

    const handleButtonClick = () => {
      if (item.equipped) {
        handleUnequip(item.category, item.name);
      } else if (item.owned) {
        handleEquip(item.id, item.category, item.name);
      } else {
        handleBuy(item.id, item.price, item.name);
      }
    };

    return (
      <article key={item.id} className={`shop-card shop-card--${item.accent}`}>
        <div className="shop-card__media">
          <span className="shop-card__category">{CATEGORY_LABELS[item.category]}</span>
          {renderPreview(item)}
        </div>

        <div className="shop-card__body">
          <div className="shop-card__title-row">
            <h2>{item.name}</h2>
            {!item.owned && (
              <span className="shop-card__price">
                <CoinIcon />
                {formatCoins(item.price)}
              </span>
            )}
          </div>
          <p>{item.description}</p>

          <div className="shop-card__footer">
            <span className="shop-card__state">
              {item.equipped ? 'Activo ahora' : item.owned ? 'Ya comprado' : 'Disponible'}
            </span>
            <button
              className="shop-card__button"
              type="button"
              onClick={handleButtonClick}
              style={{
                backgroundColor: item.equipped ? 'rgba(212, 175, 55, 0.2)' : undefined,
                color: item.equipped ? '#f1cd4f' : undefined,
                border: item.equipped ? '1px solid #f1cd4f' : undefined,
                cursor: 'pointer',
              }}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="shop-page" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Navbar />
        <div className="shop-loading" style={{ textAlign: 'center', color: '#f1cd4f' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255,255,255,0.1)',
            borderTop: '5px solid #f1cd4f',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--spacing-md)'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h2>Kargatzen / Cargando Tienda...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <Navbar />

      {/* TOAST PREMIUM NOTIFICATIONS */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '30px',
            right: '30px',
            zIndex: 99999,
            padding: '14px 24px',
            borderRadius: '12px',
            background: toast.type === 'success' ? 'rgba(21, 67, 39, 0.95)' : 'rgba(102, 26, 30, 0.95)',
            border: toast.type === 'success' ? '1px solid #2e7d32' : '1px solid #e63946',
            color: '#fff',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideIn 0.3s ease-out forwards',
          }}
        >
          <span>{toast.type === 'success' ? '🏆' : '⚠️'}</span>
          <span>{toast.message}</span>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <main className="shop-page__content">
        <section className="shop-hero" aria-labelledby="shop-title">
          <div className="shop-hero__copy">
            <p className="shop-hero__eyebrow">Denda / Tienda</p>
            <h1 id="shop-title">Personaliza tu mesa de mus</h1>
            <p>
              Gana partidas, suma monedas y desbloquea perfiles, barajas y alias
              para entrar a la partida con tu propio estilo.
            </p>
          </div>

          <aside className="wallet-panel" aria-label="Monedas disponibles">
            <span className="wallet-panel__label">Saldo</span>
            <strong>
              <CoinIcon />
              {formatCoins(coins)}
            </strong>
            <span className="wallet-panel__hint">+25 tx por cada victoria</span>
          </aside>
        </section>

        <section className="shop-summary" aria-label="Resumen de coleccion">
          {categoryTotals.map((category) => (
            <div key={category.category} className="shop-summary__item">
              <span>{category.label}</span>
              <strong>
                {category.owned}/{category.total}
              </strong>
            </div>
          ))}
        </section>

        <section className="shop-toolbar" aria-label="Filtros de tienda">
          <div className="shop-toolbar__tabs" role="tablist" aria-label="Categorias">
            {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
              <button
                key={category}
                className={activeTab === category ? 'shop-toolbar__tab shop-toolbar__tab--active' : 'shop-toolbar__tab'}
                type="button"
                onClick={() => setActiveTab(category as ShopCategory)}
                style={{ cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="shop-toolbar__sort"
            type="button"
            onClick={handleToggleSort}
            style={{ cursor: 'pointer' }}
          >
            {sortByPrice === 'none' ? '↕️ Ordenar por Precio' : `↕️ ${sortLabel}`}
          </button>
        </section>

        <section className="shop-grid" aria-label="Objetos de tienda">
          {sortedItems.map(renderShopItem)}
        </section>
      </main>
    </div>
  );
};

export default ShopPage;