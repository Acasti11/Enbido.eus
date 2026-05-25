package com.mus.backend.controller;

import com.mus.backend.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ShopController {

    @Autowired
    private ShopService shopService;

    // 1. Obtener todos los items de la tienda
    @GetMapping("/shop/items")
    public ResponseEntity<?> getShopItems() {
        try {
            return ResponseEntity.ok(shopService.getShopItems());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 2. Obtener el inventario del usuario
    @GetMapping("/usuarios/{userId}/inventory")
    public ResponseEntity<?> getUserInventory(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(shopService.getUserInventory(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 3. Comprar un artículo de la tienda
    @PostMapping("/usuarios/{userId}/buy/{itemId}")
    public ResponseEntity<?> buyItem(@PathVariable Long userId, @PathVariable Long itemId) {
        try {
            Map<String, Object> result = shopService.buyItem(userId, itemId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 4. Equipar un artículo del inventario
    @PostMapping("/usuarios/{userId}/equip/{itemId}")
    public ResponseEntity<?> equipItem(@PathVariable Long userId, @PathVariable Long itemId) {
        try {
            Map<String, Object> result = shopService.equipItem(userId, itemId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // 5. Desequipar un artículo de una categoría
    @PostMapping("/usuarios/{userId}/unequip/{category}")
    public ResponseEntity<?> unequipItem(@PathVariable Long userId, @PathVariable String category) {
        try {
            Map<String, Object> result = shopService.unequipItem(userId, category);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
