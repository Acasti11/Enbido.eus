package com.mus.backend.controller;

import com.mus.backend.model.GameMatch;
import com.mus.backend.repository.GameMatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameMatchController {

    @Autowired
    private GameMatchRepository repository;

    @PostMapping("/start")
    public ResponseEntity<GameMatch> createGameMatch(@RequestBody GameMatch game) {
        GameMatch savedGame = repository.save(game);
        return ResponseEntity.ok(savedGame);
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<GameMatch> updateGameScore(@PathVariable Long id, @RequestBody GameMatch data) {
        return repository.findById(id).map(game -> {
            game.setScoreUs(data.getScoreUs());
            game.setScoreThem(data.getScoreThem());
            game.setStatus(data.getStatus());
            return ResponseEntity.ok(repository.save(game));
        }).orElse(ResponseEntity.notFound().build());
    }
}
