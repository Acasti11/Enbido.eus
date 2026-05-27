package com.mus.backend.controller;

import com.mus.backend.service.ShopService;
import jakarta.servlet.http.HttpServletRequest;
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

    // ============================================
    // PÚBLICO: Ver items de la tienda (sin token)
    // ============================================
    @GetMapping("/shop/items")
    public ResponseEntity<?> getShopItems() {
        try {
            return ResponseEntity.ok(shopService.getShopItems());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ============================================
    // PROTEGIDO: Mi inventario (userId del token)
    // ============================================
    @GetMapping("/usuarios/me/inventory")
    public ResponseEntity<?> getMyInventory(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            return ResponseEntity.ok(shopService.getUserInventory(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ============================================
    // PROTEGIDO: Comprar item (userId del token)
    // ============================================
    @PostMapping("/usuarios/me/buy/{itemId}")
    public ResponseEntity<?> buyItem(@PathVariable Long itemId, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = shopService.buyItem(userId, itemId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ============================================
    // PROTEGIDO: Equipar item (userId del token)
    // ============================================
    @PostMapping("/usuarios/me/equip/{itemId}")
    public ResponseEntity<?> equipItem(@PathVariable Long itemId, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = shopService.equipItem(userId, itemId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ============================================
    // PROTEGIDO: Desequipar item (userId del token)
    // ============================================
    @PostMapping("/usuarios/me/unequip/{category}")
    public ResponseEntity<?> unequipItem(@PathVariable String category, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        try {
            Map<String, Object> result = shopService.unequipItem(userId, category);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ============================================
    // HELPER: extrae userId del request attribute
    // ============================================
    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }
}