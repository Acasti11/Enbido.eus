export type ShopCategory = 'profiles' | 'decks' | 'aliases';

export type ShopItem = {
    id: number;
    category: ShopCategory;
    name: string;
    description: string;
    price: number;
    owned: boolean;
    equipped: boolean;
    accent: 'gold' | 'red' | 'green';
};

export type Toast = {
    message: string;
    type: 'success' | 'error';
} | null;

export type CategoryTotal = {
    category: ShopCategory;
    label: string;
    owned: number;
    total: number;
};