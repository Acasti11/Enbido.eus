package com.mus.backend.controller;

import com.mus.backend.model.UserGameProfile;
import com.mus.backend.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    // ============================================
    // PROTEGIDO: Obtener MI perfil de juego
    // ============================================
    @GetMapping("/me/profile")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);

        if (!userProfileService.userExists(userId)) {
            return ResponseEntity.notFound().build();
        }

        UserGameProfile profile = userProfileService.getOrCreateUserProfile(userId);
        return ResponseEntity.ok(profile);
    }

    // ============================================
    // PROTEGIDO: Actualizar MI perfil de juego
    // ============================================
    @PutMapping("/me/profile")
    public ResponseEntity<?> updateMyProfile(@RequestBody UserGameProfile updatedDetails, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        
        updatedDetails.setUserId(userId);
        
        UserGameProfile saved = userProfileService.updateUserProfile(userId, updatedDetails);
        return ResponseEntity.ok(saved);
    }

    // ============================================
    // PROTEGIDO: Obtener perfil de juego de otro usuario por ID
    // ============================================
    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId, HttpServletRequest request) {
        getCurrentUserId(request);
        if (!userProfileService.userExists(userId)) {
            return ResponseEntity.notFound().build();
        }
        UserGameProfile profile = userProfileService.getOrCreateUserProfile(userId);
        return ResponseEntity.ok(profile);
    }

    // ============================================
    // PROTEGIDO: Obtener Clasificación / Leaderboard
    // ============================================
    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        return ResponseEntity.ok(userProfileService.getLeaderboard());
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