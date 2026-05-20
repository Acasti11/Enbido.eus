package com.mus.backend.repository;

import com.mus.backend.model.GameMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GameMatchRepository extends JpaRepository<GameMatch, Long> {
    List<GameMatch> findByUserId(Long userId);
}
