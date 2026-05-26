package com.mus.backend.controller;

import com.mus.backend.model.GameMatch;
import com.mus.backend.service.GameMatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameMatchController {

    @Autowired
    private GameMatchService gameMatchService;

    // ============================================
    // PROTEGIDO: Crear partida (userId del token)
    // ============================================
    @PostMapping("/start")
    public ResponseEntity<?> createGameMatch(@RequestBody GameMatch game) {
        Long userId = getCurrentUserId();
        
        // El creador de la partida es el usuario del token
        game.setCreatorId(userId);
        
        GameMatch savedGame = gameMatchService.createGameMatch(game);
        return ResponseEntity.ok(savedGame);
    }

    // ============================================
    // PROTEGIDO: Actualizar score
    // ============================================
    @PutMapping("/{id}/score")
    public ResponseEntity<?> updateGameScore(@PathVariable Long id, @RequestBody GameMatch data) {
        Long userId = getCurrentUserId();
        
        // Opcional: verificar que el usuario es participante de la partida
        // gameMatchService.verifyParticipant(id, userId);
        
        return gameMatchService.updateGameScore(id, data)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ============================================
    // HELPER: extrae userId del SecurityContext
    // ============================================
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("No autenticado");
        }
        return (Long) auth.getPrincipal();
    }
}