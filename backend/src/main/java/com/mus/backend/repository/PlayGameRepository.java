package com.mus.backend.repository;

import com.mus.backend.model.PlayGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayGameRepository extends JpaRepository<PlayGame, Long> {
}
