package com.mus.backend.repository;

import com.mus.backend.model.GameActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GameActionLogRepository extends JpaRepository<GameActionLog, Long> {
    List<GameActionLog> findByGameId(Long gameId);
}
