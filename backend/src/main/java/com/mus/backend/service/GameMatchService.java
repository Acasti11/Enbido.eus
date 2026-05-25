package com.mus.backend.service;

import com.mus.backend.model.GameMatch;
import com.mus.backend.repository.GameMatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class GameMatchService {

    @Autowired
    private GameMatchRepository repository;

    public GameMatch createGameMatch(GameMatch game) {
        return repository.save(game);
    }

    public Optional<GameMatch> updateGameScore(Long id, GameMatch data) {
        return repository.findById(id).map(game -> {
            game.setScoreUs(data.getScoreUs());
            game.setScoreThem(data.getScoreThem());
            game.setStatus(data.getStatus());
            return repository.save(game);
        });
    }
}
