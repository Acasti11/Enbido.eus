package com.mus.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ShopController {

    @PersistenceContext
    private EntityManager entityManager;

    // 1. Obtener todos los items de la tienda
    @GetMapping("/shop/items")
    public ResponseEntity<?> getShopItems() {
        try {
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
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 2. Obtener el inventario del usuario
    @GetMapping("/usuarios/{userId}/inventory")
    public ResponseEntity<?> getUserInventory(@PathVariable Long userId) {
        try {
            List<?> results = entityManager.createNativeQuery(
                "SELECT ui.item_id FROM user_inventory ui WHERE ui.user_id = :userId"
            ).setParameter("userId", userId)
             .getResultList();

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 3. Comprar un artículo de la tienda
    @PostMapping("/usuarios/{userId}/buy/{itemId}")
    @Transactional
    public ResponseEntity<?> buyItem(@PathVariable Long userId, @PathVariable Long itemId) {
        try {
            // Verificar si el usuario ya tiene el artículo en su inventario
            List<?> owned = entityManager.createNativeQuery(
                "SELECT 1 FROM user_inventory WHERE user_id = :userId AND item_id = :itemId"
            ).setParameter("userId", userId)
             .setParameter("itemId", itemId)
             .getResultList();

            if (!owned.isEmpty()) {
                return ResponseEntity.badRequest().body("Ya posees este objeto en tu inventario");
            }

            // Obtener datos del artículo (precio)
            List<?> itemData = entityManager.createNativeQuery(
                "SELECT price FROM items WHERE item_id = :itemId"
            ).setParameter("itemId", itemId)
             .getResultList();

            if (itemData.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Objeto no encontrado en la tienda");
            }

            Number priceNum = (Number) itemData.get(0);
            int price = priceNum.intValue();

            // Obtener el saldo del usuario
            List<?> coinsData = entityManager.createNativeQuery(
                "SELECT coins FROM user_game_profile WHERE user_id = :userId"
            ).setParameter("userId", userId)
             .getResultList();

            int currentCoins = 0;
            if (!coinsData.isEmpty()) {
                Number coinsNum = (Number) coinsData.get(0);
                currentCoins = coinsNum.intValue();
            } else {
                // Si no tiene perfil, crearlo por defecto
                entityManager.createNativeQuery(
                    "INSERT INTO user_game_profile (user_id, elo, coins, total_games_played, total_games_won) VALUES (:userId, 200, 1000, 0, 0)"
                ).setParameter("userId", userId)
                 .executeUpdate();
                currentCoins = 1000;
            }

            if (currentCoins < price) {
                return ResponseEntity.badRequest().body("No tienes suficientes monedas (tx) para realizar esta compra");
            }

            // Deducir las monedas del perfil
            entityManager.createNativeQuery(
                "UPDATE user_game_profile SET coins = coins - :price WHERE user_id = :userId"
            ).setParameter("price", price)
             .setParameter("userId", userId)
             .executeUpdate();

            // Insertar en el inventario
            entityManager.createNativeQuery(
                "INSERT INTO user_inventory (user_id, item_id) VALUES (:userId, :itemId)"
            ).setParameter("userId", userId)
             .setParameter("itemId", itemId)
             .executeUpdate();

            // Registrar historial de transacciones
            entityManager.createNativeQuery(
                "INSERT INTO purchase_history (user_id, item_id, coins_spent) VALUES (:userId, :itemId, :price)"
            ).setParameter("userId", userId)
             .setParameter("itemId", itemId)
             .setParameter("price", price)
             .executeUpdate();

            return ResponseEntity.ok(Map.of("message", "Compra realizada con éxito", "newCoins", currentCoins - price));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 4. Equipar un artículo del inventario
    @PostMapping("/usuarios/{userId}/equip/{itemId}")
    @Transactional
    public ResponseEntity<?> equipItem(@PathVariable Long userId, @PathVariable Long itemId) {
        try {
            // Verificar si el usuario posee el artículo
            List<?> owned = entityManager.createNativeQuery(
                "SELECT 1 FROM user_inventory WHERE user_id = :userId AND item_id = :itemId"
            ).setParameter("userId", userId)
             .setParameter("itemId", itemId)
             .getResultList();

            if (owned.isEmpty()) {
                return ResponseEntity.badRequest().body("No puedes equipar un objeto que no posees");
            }

            // Obtener la categoría del artículo para saber qué campo actualizar
            List<?> catData = entityManager.createNativeQuery(
                "SELECT c.name FROM items i JOIN categories c ON i.category_id = c.category_id WHERE i.item_id = :itemId"
            ).setParameter("itemId", itemId)
             .getResultList();

            if (catData.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Objeto no encontrado");
            }

            String category = (String) catData.get(0);
            String column = "";
            if (category.equals("profiles")) {
                column = "equipped_avatar_item_id";
            } else if (category.equals("decks")) {
                column = "equipped_deck_item_id";
            } else if (category.equals("aliases")) {
                column = "equipped_title_item_id";
            }

            if (column.isEmpty()) {
                return ResponseEntity.badRequest().body("Categoría no equipable");
            }

            // Actualizar la columna en el perfil
            entityManager.createNativeQuery(
                "UPDATE user_game_profile SET " + column + " = :itemId WHERE user_id = :userId"
            ).setParameter("itemId", itemId)
             .setParameter("userId", userId)
             .executeUpdate();

            return ResponseEntity.ok(Map.of("message", "Objeto equipado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 5. Desequipar un artículo de una categoría
    @PostMapping("/usuarios/{userId}/unequip/{category}")
    @Transactional
    public ResponseEntity<?> unequipItem(@PathVariable Long userId, @PathVariable String category) {
        try {
            String column = "";
            if (category.equals("profiles")) {
                column = "equipped_avatar_item_id";
            } else if (category.equals("decks")) {
                column = "equipped_deck_item_id";
            } else if (category.equals("aliases")) {
                column = "equipped_title_item_id";
            }

            if (column.isEmpty()) {
                return ResponseEntity.badRequest().body("Categoría no equipable");
            }

            entityManager.createNativeQuery(
                "UPDATE user_game_profile SET " + column + " = NULL WHERE user_id = :userId"
            ).setParameter("userId", userId)
             .executeUpdate();

            return ResponseEntity.ok(Map.of("message", "Objeto desequipado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
