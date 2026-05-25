package com.mus.backend.controller;

import com.mus.backend.model.GameMatch;
import com.mus.backend.service.GameMatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameMatchController {

    @Autowired
    private GameMatchService gameMatchService;

    @PostMapping("/start")
    public ResponseEntity<GameMatch> createGameMatch(@RequestBody GameMatch game) {
        GameMatch savedGame = gameMatchService.createGameMatch(game);
        return ResponseEntity.ok(savedGame);
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<GameMatch> updateGameScore(@PathVariable Long id, @RequestBody GameMatch data) {
        return gameMatchService.updateGameScore(id, data)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
