package com.mus.backend.service;

import com.mus.backend.model.GameMatch;
import com.mus.backend.repository.GameMatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class GameMatchService {

    @Autowired
    private GameMatchRepository repository;

    @Transactional
    public GameMatch createGameMatch(GameMatch game) {
        return repository.save(game);
    }

    @Transactional
    public Optional<GameMatch> updateGameScore(Long id, GameMatch data, Long userId) {
        return repository.findById(id).map(game -> {
            if (!userId.equals(game.getUserId())) {
                throw new RuntimeException("No autorizado para actualizar esta partida.");
            }
            game.setScoreUs(data.getScoreUs());
            game.setScoreThem(data.getScoreThem());
            game.setStatus(data.getStatus());
            return repository.save(game);
        });
    }
}
