import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import type { ShopCategory, Toast, CategoryTotal } from '../../../types/shop';

export const useShopData = () => {
    const [coins, setCoins] = useState<number>(0);
    const [inventory, setInventory] = useState<number[]>([]);
    const [equippedAvatarItemId, setEquippedAvatarItemId] = useState<number | null>(null);
    const [equippedDeckItemId, setEquippedDeckItemId] = useState<number | null>(null);
    const [equippedTitleItemId, setEquippedTitleItemId] = useState<number | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [toast, setToast] = useState<Toast>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
        setLoading(true);
        const [itemsRes, profileRes, invRes] = await Promise.all([
            api.get('/shop/items'),
            api.get('/usuarios/me/profile'),
            api.get('/usuarios/me/inventory'),
        ]);

        setItems(itemsRes.data);
        setCoins(profileRes.data.coins);
        setEquippedAvatarItemId(profileRes.data.equippedAvatarItemId || null);
        setEquippedDeckItemId(profileRes.data.equippedDeckItemId || null);
        setEquippedTitleItemId(profileRes.data.equippedTitleItemId || null);
        setInventory(invRes.data);
        } catch (err) {
        console.error('Error fetching shop data:', err);
        showToast('Error al conectar con el servidor', 'error');
        } finally {
        setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Acciones
    const handleBuy = useCallback(async (itemId: number, price: number, name: string) => {
        if (coins < price) {
        showToast('No tienes suficientes monedas (tx) para este objeto', 'error');
        return;
        }
        try {
        const res = await api.post(`/usuarios/me/buy/${itemId}`);
        showToast(`¡Has comprado "${name}" con éxito!`, 'success');
        setCoins(res.data.newCoins ?? coins - price);
        setInventory((prev) => [...prev, itemId]);
        } catch (err: any) {
        showToast(err.response?.data || 'Error al realizar la compra', 'error');
        }
    }, [coins, showToast]);

    const handleEquip = useCallback(async (itemId: number, category: ShopCategory, name: string) => {
        try {
        await api.post(`/usuarios/me/equip/${itemId}`);
        showToast(`¡Has equipado "${name}"!`, 'success');
        if (category === 'profiles') setEquippedAvatarItemId(itemId);
        else if (category === 'decks') setEquippedDeckItemId(itemId);
        else if (category === 'aliases') setEquippedTitleItemId(itemId);
        } catch (err: any) {
        showToast(err.response?.data || 'Error al equipar el objeto', 'error');
        }
    }, [showToast]);

    const handleUnequip = useCallback(async (category: ShopCategory, name: string) => {
        try {
        await api.post(`/usuarios/me/unequip/${category}`);
        showToast(`¡Has desequipado "${name}"!`, 'success');
        if (category === 'profiles') setEquippedAvatarItemId(null);
        else if (category === 'decks') setEquippedDeckItemId(null);
        else if (category === 'aliases') setEquippedTitleItemId(null);
        } catch (err: any) {
        showToast(err.response?.data || 'Error al desequipar el objeto', 'error');
        }
    }, [showToast]);

    const categoryTotals: CategoryTotal[] = [
        { category: 'profiles', label: 'Profilak / Perfiles', owned: 0, total: 0 },
        { category: 'decks', label: 'Kartak / Cartas', owned: 0, total: 0 },
        { category: 'aliases', label: 'Ezizenak / Alias', owned: 0, total: 0 },
    ].map((cat) => {
        const catItems = items.filter((item: any) => item.category?.name === cat.category || item.category === cat.category);
        return {
            ...cat,
            owned: catItems.filter((item: any) => 
                inventory.includes(Number(item.itemId))
            ).length,
            total: catItems.length,
        };
    });

    return {
        coins,
        inventory,
        equippedAvatarItemId,
        equippedDeckItemId,
        equippedTitleItemId,
        items,
        loading,
        toast,
        showToast,
        fetchData,
        handleBuy,
        handleEquip,
        handleUnequip,
        categoryTotals,
    };
};