package com.mus.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;

@Service
public class ShopService {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Map<String, Object>> getShopItems() {
        List<?> results = entityManager.createNativeQuery(
            "SELECT i.item_id, i.name, i.price, c.name as category_name " +
            "FROM items i " +
            "JOIN categories c ON i.category_id = c.category_id"
        ).getResultList();

        List<Map<String, Object>> items = new ArrayList<>();
        for (Object obj : results) {
            Object[] row = (Object[]) obj;
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", row[0]);
            map.put("name", row[1]);
            map.put("price", row[2]);
            map.put("category", row[3]);
            items.add(map);
        }
        return items;
    }

    public List<?> getUserInventory(Long userId) {
        return entityManager.createNativeQuery(
            "SELECT ui.item_id FROM user_inventory ui WHERE ui.user_id = :userId"
        ).setParameter("userId", userId).getResultList();
    }

    @Transactional
    public Map<String, Object> buyItem(Long userId, Long itemId) {
        // Verificar si el usuario ya tiene el artículo
        List<?> owned = entityManager.createNativeQuery(
            "SELECT 1 FROM user_inventory WHERE user_id = :userId AND item_id = :itemId"
        ).setParameter("userId", userId)
         .setParameter("itemId", itemId)
         .getResultList();

        if (!owned.isEmpty()) {
            throw new IllegalArgumentException("Ya posees este objeto en tu inventario");
        }

        // Obtener precio
        List<?> itemData = entityManager.createNativeQuery(
            "SELECT price FROM items WHERE item_id = :itemId"
        ).setParameter("itemId", itemId)
         .getResultList();

        if (itemData.isEmpty()) {
            throw new IllegalArgumentException("Objeto no encontrado en la tienda");
        }

        int price = ((Number) itemData.get(0)).intValue();

        // Obtener saldo
        List<?> coinsData = entityManager.createNativeQuery(
            "SELECT coins FROM user_game_profile WHERE user_id = :userId"
        ).setParameter("userId", userId)
         .getResultList();

        int currentCoins = 0;
        if (!coinsData.isEmpty()) {
            currentCoins = ((Number) coinsData.get(0)).intValue();
        } else {
            entityManager.createNativeQuery(
                "INSERT INTO user_game_profile (user_id, elo, coins, total_games_played, total_games_won) VALUES (:userId, 200, 1000, 0, 0)"
            ).setParameter("userId", userId).executeUpdate();
            currentCoins = 1000;
        }

        if (currentCoins < price) {
            throw new IllegalArgumentException("No tienes suficientes monedas (tx) para realizar esta compra");
        }

        // Transacción de compra
        entityManager.createNativeQuery(
            "UPDATE user_game_profile SET coins = coins - :price WHERE user_id = :userId"
        ).setParameter("price", price).setParameter("userId", userId).executeUpdate();

        entityManager.createNativeQuery(
            "INSERT INTO user_inventory (user_id, item_id) VALUES (:userId, :itemId)"
        ).setParameter("userId", userId).setParameter("itemId", itemId).executeUpdate();

        entityManager.createNativeQuery(
            "INSERT INTO purchase_history (user_id, item_id, coins_spent) VALUES (:userId, :itemId, :price)"
        ).setParameter("userId", userId).setParameter("itemId", itemId).setParameter("price", price).executeUpdate();

        return Map.of("message", "Compra realizada con éxito", "newCoins", currentCoins - price);
    }

    @Transactional
    public Map<String, Object> equipItem(Long userId, Long itemId) {
        List<?> owned = entityManager.createNativeQuery(
            "SELECT 1 FROM user_inventory WHERE user_id = :userId AND item_id = :itemId"
        ).setParameter("userId", userId).setParameter("itemId", itemId).getResultList();

        if (owned.isEmpty()) {
            throw new IllegalArgumentException("No puedes equipar un objeto que no posees");
        }

        List<?> catData = entityManager.createNativeQuery(
            "SELECT c.name FROM items i JOIN categories c ON i.category_id = c.category_id WHERE i.item_id = :itemId"
        ).setParameter("itemId", itemId).getResultList();

        if (catData.isEmpty()) {
            throw new IllegalArgumentException("Objeto no encontrado");
        }

        String category = (String) catData.get(0);
        String column = "";
        if (category.equals("profiles")) column = "equipped_avatar_item_id";
        else if (category.equals("decks")) column = "equipped_deck_item_id";
        else if (category.equals("aliases")) column = "equipped_title_item_id";
        else if (category.equals("boards")) column = "equipped_board_item_id";

        if (column.isEmpty()) {
            throw new IllegalArgumentException("Categoría no equipable");
        }

        entityManager.createNativeQuery(
            "UPDATE user_game_profile SET " + column + " = :itemId WHERE user_id = :userId"
        ).setParameter("itemId", itemId).setParameter("userId", userId).executeUpdate();

        return Map.of("message", "Objeto equipado con éxito");
    }

    @Transactional
    public Map<String, Object> unequipItem(Long userId, String category) {
        String column = "";
        if (category.equals("profiles")) column = "equipped_avatar_item_id";
        else if (category.equals("decks")) column = "equipped_deck_item_id";
        else if (category.equals("aliases")) column = "equipped_title_item_id";
        else if (category.equals("boards")) column = "equipped_board_item_id";

        if (column.isEmpty()) {
            throw new IllegalArgumentException("Categoría no equipable");
        }

        entityManager.createNativeQuery(
            "UPDATE user_game_profile SET " + column + " = NULL WHERE user_id = :userId"
        ).setParameter("userId", userId).executeUpdate();

        return Map.of("message", "Objeto desequipado con éxito");
    }
}
