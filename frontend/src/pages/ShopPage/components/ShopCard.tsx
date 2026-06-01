import React from 'react';
import CoinIcon from './Coinicon';
import type { ShopItem, ShopCategory } from '../../../types/shop';

/*const ITEM_METADATA: Record<number, { description: string; accent: 'gold' | 'red' | 'green' }> = {
    1: { description: 'Marco dorado y ficha premium para partidas ganadas.', accent: 'gold' },
    2: { description: 'Avatar sobrio con textura de pared verde.', accent: 'green' },
    3: { description: 'Cartas crema con palos marcados en rojo y verde.', accent: 'red' },
    4: { description: 'Reverso oscuro con detalles dorados para mesas nocturnas.', accent: 'gold' },
    5: { description: 'Alias visible bajo tu nombre en el perfil de jugador.', accent: 'green' },
    6: { description: 'Título para quien sabe cuándo apretar la apuesta.', accent: 'red' },
};*/

const CATEGORY_LABELS: Record<ShopCategory, string> = {
    profiles: 'Profilak / Perfiles',
    decks: 'Kartak / Cartas',
    aliases: 'Ezizenak / Alias',
};

interface ShopCardProps {
    item: ShopItem;
    initials: string;
    onBuy: (id: number, price: number, name: string) => void;
    onEquip: (id: number, category: ShopCategory, name: string) => void;
    onUnequip: (category: ShopCategory, name: string) => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ item, initials, onBuy, onEquip, onUnequip }): React.JSX.Element => {
    const handleClick = () => {
        if (item.equipped) {
            onUnequip(item.category, item.name);
        } else if (item.owned) {
            onEquip(item.id, item.category, item.name);
        } else {
            onBuy(item.id, item.price, item.name);
        }
    };

    const renderPreview = (): React.JSX.Element => {
        if (item.category === 'profiles') {
            const ringClass = item.id === 1 ? 'shop-card__profile-ring--gold' : 'shop-card__profile-ring--green';
            return (
                <div className="shop-card__profile">
                    <div className="shop-card__avatar">{initials}</div>
                    <div className={`shop-card__profile-ring ${ringClass}`} />
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

    return (
        <article className={`shop-card shop-card--${item.accent}`}>
            <div className="shop-card__media">
                <span className="shop-card__category">{CATEGORY_LABELS[item.category]}</span>
                {renderPreview()}
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title-row">
                    <h2>{item.name}</h2>
                    {!item.owned && (
                        <span className="shop-card__price">
                            <CoinIcon />
                            {item.price.toLocaleString('es-ES')} tx
                        </span>
                    )}
                </div>
                <p>{item.description}</p>

                <div className="shop-card__footer">
                    <span className="shop-card__state">
                        {item.equipped ? 'Activo ahora' : item.owned ? 'Ya comprado' : 'Disponible'}
                    </span>
                    <button
                        className={`shop-card__button ${item.equipped ? 'shop-card__button--equipped' : ''}`}
                        type="button"
                        onClick={handleClick}
                    >
                        {item.equipped ? 'Equipado' : item.owned ? 'Equipar' : 'Comprar'}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default ShopCard;