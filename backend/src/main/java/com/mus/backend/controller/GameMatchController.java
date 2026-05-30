package com.mus.backend.controller;

import com.mus.backend.model.GameMatch;
import com.mus.backend.service.GameMatchService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameMatchController {

    @Autowired
    private GameMatchService gameMatchService;

    // ============================================
    // PROTEGIDO: Crear partida
    // ============================================
    @PostMapping("/start")
    public ResponseEntity<GameMatch> createGameMatch(@RequestBody GameMatch game, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        game.setUserId(userId);
        GameMatch savedGame = gameMatchService.createGameMatch(game);
        return ResponseEntity.ok(savedGame);
    }

    // ============================================
    // PROTEGIDO: Actualizar score
    // ============================================
    @PutMapping("/{id}/score")
    public ResponseEntity<?> updateGameScore(@PathVariable Long id, @RequestBody GameMatch data, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        return gameMatchService.updateGameScore(id, data, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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