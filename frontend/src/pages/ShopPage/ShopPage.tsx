import React from 'react';
import Navbar from '../../components/layout/Navbar';
import './shop-page.css';

type ShopCategory = 'profiles' | 'decks' | 'aliases';

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

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 1,
    category: 'profiles',
    name: 'Perfil Txapeldun',
    description: 'Marco dorado y ficha premium para partidas ganadas.',
    price: 850,
    owned: true,
    equipped: true,
    accent: 'gold',
  },
  {
    id: 2,
    category: 'profiles',
    name: 'Perfil Fronton',
    description: 'Avatar sobrio con textura de pared verde.',
    price: 620,
    accent: 'green',
  },
  {
    id: 3,
    category: 'decks',
    name: 'Baraja Euskal',
    description: 'Cartas crema con palos marcados en rojo y verde.',
    price: 1200,
    owned: true,
    accent: 'red',
  },
  {
    id: 4,
    category: 'decks',
    name: 'Baraja Gau Beltza',
    description: 'Reverso oscuro con detalles dorados para mesas nocturnas.',
    price: 1450,
    accent: 'gold',
  },
  {
    id: 5,
    category: 'aliases',
    name: 'Handia',
    description: 'Alias visible bajo tu nombre en el perfil de jugador.',
    price: 350,
    accent: 'green',
  },
  {
    id: 6,
    category: 'aliases',
    name: 'Enbido Maisu',
    description: 'Titulo para quien sabe cuando apretar la apuesta.',
    price: 700,
    accent: 'red',
  },
];

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  profiles: 'Profilak / Perfiles',
  decks: 'Kartak / Cartas',
  aliases: 'Ezizenak / Alias',
};

const categoryTotals = Object.entries(CATEGORY_LABELS).map(([category, label]) => {
  const items = SHOP_ITEMS.filter((item) => item.category === category);

  return {
    category: category as ShopCategory,
    label,
    owned: items.filter((item) => item.owned).length,
    total: items.length,
  };
});

const formatCoins = (value: number): string => `${value.toLocaleString('es-ES')} tx`;

const CoinIcon: React.FC = (): React.JSX.Element => (
  <svg className="coin-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5a5 5 0 1 0 0 7" />
  </svg>
);

const renderPreview = (item: ShopItem): React.JSX.Element => {
  if (item.category === 'profiles') {
    return (
      <div className="shop-card__profile">
        <div className="shop-card__avatar">MP</div>
        <div className="shop-card__profile-ring" />
      </div>
    );
  }

  if (item.category === 'decks') {
    return (
      <div className="shop-card__deck" aria-hidden="true">
        <div className="shop-card__playing-card shop-card__playing-card--left">
          <span>4</span>
          <span>&clubs;</span>
        </div>
        <div className="shop-card__playing-card shop-card__playing-card--right">
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

  return (
    <article key={item.id} className={`shop-card shop-card--${item.accent}`}>
      <div className="shop-card__media">
        <span className="shop-card__category">{CATEGORY_LABELS[item.category]}</span>
        {renderPreview(item)}
      </div>

      <div className="shop-card__body">
        <div className="shop-card__title-row">
          <h2>{item.name}</h2>
          <span className="shop-card__price">
            <CoinIcon />
            {formatCoins(item.price)}
          </span>
        </div>
        <p>{item.description}</p>

        <div className="shop-card__footer">
          <span className="shop-card__state">
            {item.equipped ? 'Activo ahora' : item.owned ? 'Ya comprado' : 'Disponible'}
          </span>
          <button className="shop-card__button" type="button" disabled={item.equipped}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
};

const ShopPage: React.FC = (): React.JSX.Element => {
  return (
    <div className="shop-page">
      <Navbar />

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
              2.450 tx
            </strong>
            <span className="wallet-panel__hint">+120 tx en la ultima victoria</span>
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
            {Object.entries(CATEGORY_LABELS).map(([category, label], index) => (
              <button
                key={category}
                className={index === 0 ? 'shop-toolbar__tab shop-toolbar__tab--active' : 'shop-toolbar__tab'}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <button className="shop-toolbar__sort" type="button">
            Precio bajo primero
          </button>
        </section>

        <section className="shop-grid" aria-label="Objetos de tienda">
          {SHOP_ITEMS.map(renderShopItem)}
        </section>
      </main>
    </div>
  );
};

export default ShopPage;